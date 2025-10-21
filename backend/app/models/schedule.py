"""
Doctor schedule model for managing availability
"""
from sqlalchemy import Column, Integer, String, DateTime, Time, ForeignKey, Boolean, Enum as SQLEnum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class DayOfWeek(str, enum.Enum):
    """Day of week enumeration"""
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class ScheduleType(str, enum.Enum):
    """Schedule type enumeration"""
    REGULAR = "regular"
    EXCEPTION = "exception"
    HOLIDAY = "holiday"
    BLOCKED = "blocked"


class DoctorSchedule(Base):
    """Doctor schedule model"""
    __tablename__ = "doctor_schedules"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Schedule type
    schedule_type = Column(
        SQLEnum(ScheduleType),
        default=ScheduleType.REGULAR,
        nullable=False
    )
    
    # For regular schedules
    day_of_week = Column(SQLEnum(DayOfWeek), nullable=True)
    
    # For exception schedules
    specific_date = Column(DateTime(timezone=True), nullable=True)
    
    # Time slots
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Slot configuration
    slot_duration_minutes = Column(Integer, default=30, nullable=False)
    buffer_time_minutes = Column(Integer, default=0, nullable=False)
    max_patients_per_slot = Column(Integer, default=1, nullable=False)
    
    # Location
    location = Column(String(200), nullable=True)
    location_address = Column(String(500), nullable=True)
    
    # Availability settings
    is_available = Column(Boolean, default=True, nullable=False)
    is_video_consultation = Column(Boolean, default=False, nullable=False)

    # Soft delete flag
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Recurrence settings (for regular schedules)
    recurrence_end_date = Column(DateTime(timezone=True), nullable=True)
    
    # Customizable rules (stored as JSON)
    custom_rules = Column(JSON, nullable=True)
    
    # Notes
    notes = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    doctor = relationship("User")
    
    def __repr__(self):
        return f"<DoctorSchedule {self.id} - Doctor: {self.doctor_id}>"
