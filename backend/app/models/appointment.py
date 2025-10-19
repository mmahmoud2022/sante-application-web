"""
Appointment model for managing medical appointments
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Enum as SQLEnum, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class AppointmentStatus(str, enum.Enum):
    """Appointment status enumeration"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class AppointmentType(str, enum.Enum):
    """Appointment type enumeration"""
    IN_PERSON = "in_person"
    VIDEO_CALL = "video_call"
    PHONE_CALL = "phone_call"


class Appointment(Base):
    """Appointment model"""
    __tablename__ = "appointments"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Appointment details
    appointment_date = Column(DateTime(timezone=True), nullable=False, index=True)
    duration_minutes = Column(Integer, default=30, nullable=False)
    
    # Type and status
    appointment_type = Column(
        SQLEnum(AppointmentType),
        default=AppointmentType.IN_PERSON,
        nullable=False
    )
    status = Column(
        SQLEnum(AppointmentStatus),
        default=AppointmentStatus.PENDING,
        nullable=False,
        index=True
    )
    
    # Appointment information
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)
    prescription = Column(Text, nullable=True)
    
    # Video call information
    video_call_link = Column(String(500), nullable=True)
    video_call_room_id = Column(String(100), nullable=True)
    
    # Reminders
    reminder_sent = Column(Boolean, default=False, nullable=False)
    reminder_sent_at = Column(DateTime(timezone=True), nullable=True)
    
    # Cancellation
    cancelled_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    patient = relationship(
        "User",
        foreign_keys=[patient_id],
        back_populates="appointments_as_patient"
    )
    doctor = relationship(
        "User",
        foreign_keys=[doctor_id],
        back_populates="appointments_as_doctor"
    )
    
    def __repr__(self):
        return f"<Appointment {self.id} - Patient: {self.patient_id}, Doctor: {self.doctor_id}>"
