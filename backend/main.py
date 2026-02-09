from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import models, schemas, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="HRMS Lite API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Dashboard Stats (Bonus) ---
@app.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_employees = db.query(models.Employee).count()
    present_today = db.query(models.Attendance).filter(
        models.Attendance.date == date.today(),
        models.Attendance.status == "Present"
    ).count()
    return {"total_employees": total_employees, "present_today": present_today}

# --- Employee Routes ---
@app.post("/employees/", response_model=schemas.EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(emp: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    if db.query(models.Employee).filter(models.Employee.email == emp.email).first():
        raise HTTPException(status_code=400, detail="Email already exists.")
    if db.query(models.Employee).filter(models.Employee.employee_id == emp.employee_id).first():
        raise HTTPException(status_code=400, detail="Employee ID already exists.")
    
    new_emp = models.Employee(**emp.dict())
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return new_emp

@app.get("/employees/", response_model=List[schemas.EmployeeResponse])
def get_employees(db: Session = Depends(get_db)):
    return db.query(models.Employee).all()

@app.delete("/employees/{emp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(emp_id: str, db: Session = Depends(get_db)):
    emp = db.query(models.Employee).filter(models.Employee.employee_id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(emp)
    db.commit()
    return None

# --- Attendance Routes ---
@app.post("/attendance/", status_code=status.HTTP_201_CREATED)
def mark_attendance(att: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    emp = db.query(models.Employee).filter(models.Employee.employee_id == att.employee_id_str).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    existing = db.query(models.Attendance).filter(
        models.Attendance.employee_id == emp.id,
        models.Attendance.date == att.date
    ).first()
    
    if existing:
        existing.status = att.status
    else:
        new_att = models.Attendance(date=att.date, status=att.status, employee_id=emp.id)
        db.add(new_att)
    
    db.commit()
    return {"message": "Attendance recorded"}

@app.get("/attendance/{emp_id}", response_model=List[schemas.AttendanceResponse])
def get_attendance(emp_id: str, filter_date: Optional[date] = None, db: Session = Depends(get_db)):
    emp = db.query(models.Employee).filter(models.Employee.employee_id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    query = db.query(models.Attendance).filter(models.Attendance.employee_id == emp.id)
    if filter_date:
        query = query.filter(models.Attendance.date == filter_date)
        
    return query.all()