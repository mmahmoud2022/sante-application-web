"""
Medical record schemas for request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class MedicalRecordBase(BaseModel):
    """Base medical record schema"""
    blood_type: Optional[str] = Field(None, max_length=10)
    height_cm: Optional[int] = Field(None, ge=0, le=300)
    weight_kg: Optional[int] = Field(None, ge=0, le=500)
    allergies: Optional[List[str]] = None
    chronic_conditions: Optional[List[str]] = None
    medications: Optional[List[Dict[str, Any]]] = None
    surgeries: Optional[List[Dict[str, Any]]] = None
    vaccinations: Optional[List[Dict[str, Any]]] = None
    family_history: Optional[str] = None
    emergency_contact_name: Optional[str] = Field(None, max_length=200)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    emergency_contact_relation: Optional[str] = Field(None, max_length=50)
    insurance_provider: Optional[str] = Field(None, max_length=200)
    insurance_policy_number: Optional[str] = Field(None, max_length=100)
    insurance_valid_until: Optional[datetime] = None
    notes: Optional[str] = None


class MedicalRecordCreate(MedicalRecordBase):
    """Schema for creating a new medical record"""
    patient_id: int


class MedicalRecordUpdate(MedicalRecordBase):
    """Schema for updating medical record information"""
    pass


class MedicalRecordResponse(MedicalRecordBase):
    """Schema for medical record response"""
    id: int
    patient_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
