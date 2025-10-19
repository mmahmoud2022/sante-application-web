"""
Vaccination record schemas for request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class VaccinationRecordBase(BaseModel):
    """Base vaccination record schema"""
    vaccine_name: str = Field(..., min_length=1, max_length=200)
    vaccine_type: Optional[str] = Field(None, max_length=100)
    manufacturer: Optional[str] = Field(None, max_length=200)
    lot_number: Optional[str] = Field(None, max_length=100)
    dose_number: Optional[int] = Field(None, gt=0)
    total_doses: Optional[int] = Field(None, gt=0)
    administration_date: datetime
    administration_site: Optional[str] = Field(None, max_length=100)
    route: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class VaccinationRecordCreate(VaccinationRecordBase):
    """Schema for creating a new vaccination record"""
    patient_id: int
    administered_by: Optional[int] = None
    next_dose_due: Optional[datetime] = None
    facility_name: Optional[str] = Field(None, max_length=200)
    facility_address: Optional[str] = None
    adverse_reactions: Optional[str] = None


class VaccinationRecordUpdate(BaseModel):
    """Schema for updating vaccination record information"""
    next_dose_due: Optional[datetime] = None
    reminder_sent: Optional[bool] = None
    notes: Optional[str] = None
    adverse_reactions: Optional[str] = None
    verified: Optional[bool] = None


class VaccinationRecordResponse(VaccinationRecordBase):
    """Schema for vaccination record response"""
    id: int
    patient_id: int
    administered_by: Optional[int] = None
    next_dose_due: Optional[datetime] = None
    reminder_sent: bool
    facility_name: Optional[str] = None
    facility_address: Optional[str] = None
    adverse_reactions: Optional[str] = None
    verified: bool
    verification_document: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
