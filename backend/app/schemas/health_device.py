"""
Health device data schemas for request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

from app.models.health_device import DeviceType, MeasurementType


class HealthDeviceDataBase(BaseModel):
    """Base health device data schema"""
    device_type: DeviceType
    measurement_type: MeasurementType
    measurement_date: datetime
    value: Optional[float] = None
    value_unit: Optional[str] = Field(None, max_length=20)


class HealthDeviceDataCreate(HealthDeviceDataBase):
    """Schema for creating new health device data"""
    patient_id: int
    device_name: Optional[str] = Field(None, max_length=100)
    device_id: Optional[str] = Field(None, max_length=200)
    manufacturer: Optional[str] = Field(None, max_length=100)
    additional_data: Optional[dict] = None
    notes: Optional[str] = Field(None, max_length=500)
    source_system: Optional[str] = Field(None, max_length=100)


class HealthDeviceDataUpdate(BaseModel):
    """Schema for updating health device data"""
    value: Optional[float] = None
    value_unit: Optional[str] = Field(None, max_length=20)
    additional_data: Optional[dict] = None
    notes: Optional[str] = Field(None, max_length=500)


class HealthDeviceDataResponse(HealthDeviceDataBase):
    """Schema for health device data response"""
    id: int
    patient_id: int
    device_name: Optional[str] = None
    device_id: Optional[str] = None
    manufacturer: Optional[str] = None
    additional_data: Optional[dict] = None
    notes: Optional[str] = None
    synced_at: Optional[datetime] = None
    source_system: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
