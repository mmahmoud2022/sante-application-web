"""
Vaccination record model for tracking patient vaccinations
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class VaccinationRecord(Base):
    """Vaccination record model"""
    __tablename__ = "vaccination_records"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    administered_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Vaccine details
    vaccine_name = Column(String(200), nullable=False)
    vaccine_type = Column(String(100), nullable=True)
    manufacturer = Column(String(200), nullable=True)
    lot_number = Column(String(100), nullable=True)
    dose_number = Column(Integer, nullable=True)
    total_doses = Column(Integer, nullable=True)
    
    # Administration details
    administration_date = Column(DateTime(timezone=True), nullable=False, index=True)
    administration_site = Column(String(100), nullable=True)
    route = Column(String(50), nullable=True)
    
    # Next dose information
    next_dose_due = Column(DateTime(timezone=True), nullable=True)
    reminder_sent = Column(Boolean, default=False, nullable=False)
    
    # Location
    facility_name = Column(String(200), nullable=True)
    facility_address = Column(Text, nullable=True)
    
    # Notes and reactions
    notes = Column(Text, nullable=True)
    adverse_reactions = Column(Text, nullable=True)
    
    # Verification
    verified = Column(Boolean, default=False, nullable=False)
    verification_document = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    patient = relationship("User", foreign_keys=[patient_id])
    administrator = relationship("User", foreign_keys=[administered_by])
    
    def __repr__(self):
        return f"<VaccinationRecord {self.id} - {self.vaccine_name}>"
