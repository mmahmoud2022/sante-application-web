"""
Health device data model for connected health devices
"""
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class DeviceType(str, enum.Enum):
    """Device type enumeration"""
    FITNESS_TRACKER = "fitness_tracker"
    SMARTWATCH = "smartwatch"
    BLOOD_PRESSURE_MONITOR = "blood_pressure_monitor"
    GLUCOSE_MONITOR = "glucose_monitor"
    HEART_RATE_MONITOR = "heart_rate_monitor"
    WEIGHT_SCALE = "weight_scale"
    THERMOMETER = "thermometer"
    PULSE_OXIMETER = "pulse_oximeter"
    OTHER = "other"


class MeasurementType(str, enum.Enum):
    """Measurement type enumeration"""
    HEART_RATE = "heart_rate"
    BLOOD_PRESSURE = "blood_pressure"
    BLOOD_GLUCOSE = "blood_glucose"
    WEIGHT = "weight"
    TEMPERATURE = "temperature"
    OXYGEN_SATURATION = "oxygen_saturation"
    STEPS = "steps"
    CALORIES = "calories"
    SLEEP = "sleep"
    OTHER = "other"


class HealthDeviceData(Base):
    """Health device data model"""
    __tablename__ = "health_device_data"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Device information
    device_type = Column(
        SQLEnum(DeviceType),
        nullable=False
    )
    device_name = Column(String(100), nullable=True)
    device_id = Column(String(200), nullable=True)
    manufacturer = Column(String(100), nullable=True)
    
    # Measurement information
    measurement_type = Column(
        SQLEnum(MeasurementType),
        nullable=False,
        index=True
    )
    measurement_date = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Values (flexible storage)
    value = Column(Float, nullable=True)
    value_unit = Column(String(20), nullable=True)
    
    # Additional data stored as JSON
    additional_data = Column(JSON, nullable=True)
    
    # Metadata
    notes = Column(String(500), nullable=True)
    
    # Synchronization
    synced_at = Column(DateTime(timezone=True), nullable=True)
    source_system = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    patient = relationship("User")
    
    def __repr__(self):
        return f"<HealthDeviceData {self.id} - {self.measurement_type}>"
