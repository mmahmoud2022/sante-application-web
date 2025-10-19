"""
Appointment schemas for request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

from app.models.appointment import AppointmentStatus, AppointmentType


class AppointmentBase(BaseModel):
    """Base appointment schema"""
    doctor_id: int
    appointment_date: datetime
    duration_minutes: int = Field(default=30, ge=15, le=180)
    appointment_type: AppointmentType = AppointmentType.IN_PERSON
    reason: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    """Schema for creating a new appointment"""
    pass


class AppointmentUpdate(BaseModel):
    """Schema for updating appointment information"""
    appointment_date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=180)
    appointment_type: Optional[AppointmentType] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    status: Optional[AppointmentStatus] = None


class AppointmentResponse(AppointmentBase):
    """Schema for appointment response"""
    id: int
    patient_id: int
    status: AppointmentStatus
    notes: Optional[str] = None
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    video_call_link: Optional[str] = None
    video_call_room_id: Optional[str] = None
    reminder_sent: bool
    reminder_sent_at: Optional[datetime] = None
    cancelled_by: Optional[int] = None
    cancellation_reason: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
