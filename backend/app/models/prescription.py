"""
Prescription model for managing patient prescriptions
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class PrescriptionStatus(str, enum.Enum):
    """Prescription status enumeration"""
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class Prescription(Base):
    """Prescription model"""
    __tablename__ = "prescriptions"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    
    # Prescription details
    medication_name = Column(String(200), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)
    duration_days = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=True)
    refills_allowed = Column(Integer, default=0, nullable=False)
    refills_remaining = Column(Integer, default=0, nullable=False)
    
    # Instructions
    instructions = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Status
    status = Column(
        SQLEnum(PrescriptionStatus),
        default=PrescriptionStatus.ACTIVE,
        nullable=False,
        index=True
    )
    
    # Dates
    prescribed_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    
    # Renewal tracking
    auto_renewal_enabled = Column(Boolean, default=False, nullable=False)
    last_renewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])
    document = relationship("Document")
    
    def __repr__(self):
        return f"<Prescription {self.id} - {self.medication_name}>"
