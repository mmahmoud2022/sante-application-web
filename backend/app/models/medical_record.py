"""
Medical record model for storing patient medical information
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class MedicalRecord(Base):
    """Medical record model"""
    __tablename__ = "medical_records"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Medical information
    blood_type = Column(String(10), nullable=True)
    height_cm = Column(Integer, nullable=True)
    weight_kg = Column(Integer, nullable=True)
    
    # Medical history
    allergies = Column(JSON, nullable=True)  # List of allergies
    chronic_conditions = Column(JSON, nullable=True)  # List of chronic conditions
    medications = Column(JSON, nullable=True)  # List of current medications
    surgeries = Column(JSON, nullable=True)  # List of past surgeries
    vaccinations = Column(JSON, nullable=True)  # List of vaccinations
    
    # Family medical history
    family_history = Column(Text, nullable=True)
    
    # Emergency contact
    emergency_contact_name = Column(String(200), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    emergency_contact_relation = Column(String(50), nullable=True)
    
    # Insurance information
    insurance_provider = Column(String(200), nullable=True)
    insurance_policy_number = Column(String(100), nullable=True)
    insurance_valid_until = Column(DateTime, nullable=True)
    
    # Additional notes
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    patient = relationship("User", back_populates="medical_records")
    
    def __repr__(self):
        return f"<MedicalRecord Patient: {self.patient_id}>"
