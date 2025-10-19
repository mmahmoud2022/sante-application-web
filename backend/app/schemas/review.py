"""
Review and rating schemas for request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class ReviewBase(BaseModel):
    """Base review schema"""
    rating: float = Field(..., ge=1.0, le=5.0)
    title: Optional[str] = Field(None, max_length=200)
    review_text: Optional[str] = None


class ReviewCreate(ReviewBase):
    """Schema for creating a new review"""
    doctor_id: int
    appointment_id: Optional[int] = None


class ReviewUpdate(BaseModel):
    """Schema for updating review"""
    rating: Optional[float] = Field(None, ge=1.0, le=5.0)
    title: Optional[str] = Field(None, max_length=200)
    review_text: Optional[str] = None


class DoctorResponse(BaseModel):
    """Schema for doctor response to review"""
    doctor_response: str = Field(..., min_length=1)


class ReviewModeration(BaseModel):
    """Schema for moderating review"""
    is_published: bool
    is_flagged: bool
    flagged_reason: Optional[str] = None


class ReviewResponse(ReviewBase):
    """Schema for review response"""
    id: int
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    verified_visit: bool
    doctor_response: Optional[str] = None
    doctor_response_date: Optional[datetime] = None
    is_published: bool
    is_flagged: bool
    flagged_reason: Optional[str] = None
    helpful_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
