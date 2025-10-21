"""
Doctor-specific schemas for API responses
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.schedule import DoctorScheduleResponse


class DoctorPatientSummary(BaseModel):
    """Summary of a doctor's patient with last appointment information"""

    id: int
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    last_appointment_date: Optional[datetime] = None
    next_appointment_date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DoctorProfileResponse(BaseModel):
    """Detailed doctor profile"""

    id: int
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = None
    consultation_fee: Optional[int] = None
    rating_average: Optional[float] = None
    rating_count: Optional[int] = None
    accepting_new_patients: Optional[bool] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    profile_image: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DoctorScheduleOverview(BaseModel):
    """Doctor schedule overview response"""

    schedules: List[DoctorScheduleResponse]


class AppointmentSlot(BaseModel):
    """Available appointment slot"""

    time: str
    duration: int
    location: Optional[str] = None


class AppointmentBookingDoctor(BaseModel):
    """Doctor info returned in appointment booking helper"""

    id: int
    first_name: str
    last_name: str
    specialization: Optional[str] = None
    city: Optional[str] = None
    rating_average: Optional[float] = None
    rating_count: Optional[int] = None
    consultation_fee: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class AppointmentBookingResponse(BaseModel):
    """Response payload for patient appointment booking helper endpoint"""

    doctors: List[AppointmentBookingDoctor]
    selected_doctor: Optional[AppointmentBookingDoctor] = None
    available_slots: Optional[List[AppointmentSlot]] = None
