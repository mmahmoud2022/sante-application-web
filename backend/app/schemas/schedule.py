"""
Doctor schedule schemas for request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, time

from app.models.schedule import DayOfWeek, ScheduleType


class DoctorScheduleBase(BaseModel):
    """Base doctor schedule schema"""
    schedule_type: ScheduleType
    start_time: time
    end_time: time
    slot_duration_minutes: int = Field(30, gt=0, le=240)
    buffer_time_minutes: int = Field(0, ge=0, le=60)
    max_patients_per_slot: int = Field(1, gt=0, le=10)


class DoctorScheduleCreate(DoctorScheduleBase):
    """Schema for creating a new doctor schedule"""
    day_of_week: Optional[DayOfWeek] = None
    specific_date: Optional[datetime] = None
    location: Optional[str] = Field(None, max_length=200)
    location_address: Optional[str] = Field(None, max_length=500)
    is_available: bool = True
    is_video_consultation: bool = False
    recurrence_end_date: Optional[datetime] = None
    custom_rules: Optional[dict] = None
    notes: Optional[str] = Field(None, max_length=500)


class DoctorScheduleUpdate(BaseModel):
    """Schema for updating doctor schedule"""
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_available: Optional[bool] = None
    notes: Optional[str] = Field(None, max_length=500)


class DoctorScheduleResponse(DoctorScheduleBase):
    """Schema for doctor schedule response"""
    id: int
    doctor_id: int
    day_of_week: Optional[DayOfWeek] = None
    specific_date: Optional[datetime] = None
    location: Optional[str] = None
    location_address: Optional[str] = None
    is_available: bool
    is_video_consultation: bool
    recurrence_end_date: Optional[datetime] = None
    custom_rules: Optional[dict] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
