from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    department = Column(String, nullable=False)
    
    attendance = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    status = Column(String, nullable=False) 
    employee_id = Column(Integer, ForeignKey("employees.id"))
    
    employee = relationship("Employee", back_populates="attendance")