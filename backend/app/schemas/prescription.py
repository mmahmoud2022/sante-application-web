"""
Prescription schemas for request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Union
from datetime import datetime, date

from app.models.prescription import PrescriptionStatus
from app.schemas.document import DocumentResponse


class PrescriptionBase(BaseModel):
    """Base prescription schema"""
    medication_name: str = Field(..., min_length=1, max_length=200)
    dosage: str = Field(..., min_length=1, max_length=100)
    frequency: str = Field(..., min_length=1, max_length=100)
    duration_days: int = Field(..., gt=0)
    quantity: Optional[int] = Field(None, gt=0)
    refills_allowed: int = Field(0, ge=0)
    instructions: Optional[str] = None
    notes: Optional[str] = None


class PrescriptionCreate(PrescriptionBase):
    """Schema for creating a new prescription"""
    patient_id: int
    appointment_id: Optional[int] = None
    document_id: Optional[int] = None
    start_date: Optional[Union[str, date, datetime]] = None
    end_date: Optional[Union[str, date, datetime]] = None
    auto_renewal_enabled: bool = False


class PrescriptionUpdate(BaseModel):
    """Schema for updating prescription information"""
    status: Optional[PrescriptionStatus] = None
    refills_remaining: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None
    auto_renewal_enabled: Optional[bool] = None
    document_id: Optional[int] = None


class PrescriptionResponse(PrescriptionBase):
    """Schema for prescription response"""
    id: int
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    document_id: Optional[int] = None
    refills_remaining: int
    status: PrescriptionStatus
    prescribed_date: datetime
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    auto_renewal_enabled: bool
    last_renewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    document: Optional[DocumentResponse] = None
    
    model_config = ConfigDict(from_attributes=True)
