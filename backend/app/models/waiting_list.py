"""
Waiting list model for managing appointment cancellation replacement
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class WaitingList(Base):
    """Waiting list for appointment slots"""
    __tablename__ = "waiting_lists"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Waiting list preferences
    preferred_date_start = Column(DateTime(timezone=True), nullable=True)
    preferred_date_end = Column(DateTime(timezone=True), nullable=True)
    preferred_time_slots = Column(String(500), nullable=True)  # JSON: list of time ranges
    appointment_reason = Column(String(500), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    notified = Column(Boolean, default=False, nullable=False)
    notified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])
    
    def __repr__(self):
        return f"<WaitingList {self.id} - Patient: {self.patient_id}, Doctor: {self.doctor_id}>"
