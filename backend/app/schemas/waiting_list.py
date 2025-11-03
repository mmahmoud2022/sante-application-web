"""
Waiting list schemas for request/response validation
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class WaitingListBase(BaseModel):
    """Base waiting list schema"""
    doctor_id: int
    preferred_date_start: Optional[datetime] = None
    preferred_date_end: Optional[datetime] = None
    preferred_time_slots: Optional[str] = None
    appointment_reason: Optional[str] = None


class WaitingListCreate(WaitingListBase):
    """Schema for creating a waiting list entry"""
    pass


class WaitingListUpdate(BaseModel):
    """Schema for updating waiting list entry"""
    preferred_date_start: Optional[datetime] = None
    preferred_date_end: Optional[datetime] = None
    preferred_time_slots: Optional[str] = None
    appointment_reason: Optional[str] = None
    is_active: Optional[bool] = None


class WaitingListResponse(WaitingListBase):
    """Schema for waiting list response"""
    id: int
    patient_id: int
    is_active: bool
    notified: bool
    notified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
