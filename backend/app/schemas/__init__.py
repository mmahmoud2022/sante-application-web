"""
Pydantic schemas for request/response validation
"""
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserLogin
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordUpdate, MedicalRecordResponse

__all__ = [
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserLogin",
    "AppointmentCreate",
    "AppointmentUpdate",
    "AppointmentResponse",
    "MedicalRecordCreate",
    "MedicalRecordUpdate",
    "MedicalRecordResponse",
]
