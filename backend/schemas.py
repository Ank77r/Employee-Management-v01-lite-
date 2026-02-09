from pydantic import BaseModel, EmailStr, constr
from datetime import date
from typing import List, Optional

class EmployeeBase(BaseModel):
    employee_id: constr(min_length=1)
    full_name: constr(min_length=1)
    email: EmailStr
    department: constr(min_length=1)

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeResponse(EmployeeBase):
    id: int
    class Config:
        from_attributes = True

class AttendanceCreate(BaseModel):
    date: date
    status: str
    employee_id_str: str

class AttendanceResponse(BaseModel):
    date: date
    status: str
    class Config:
        from_attributes = True