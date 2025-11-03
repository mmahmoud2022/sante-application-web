"""
User model for patients, doctors, and administrators
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum as SQLEnum, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    """User role enumeration"""
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Authentication
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    
    # Role and permissions
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.PATIENT)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Professional information (for doctors)
    specialization = Column(String(100), nullable=True)
    license_number = Column(String(50), nullable=True)
    bio = Column(Text, nullable=True)
    experience_years = Column(Integer, nullable=True)
    consultation_fee = Column(Integer, nullable=True)  # in cents
    
    # Address information
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True)
    
    # Profile image
    profile_image = Column(String(500), nullable=True)
    
    # Multi-factor authentication
    mfa_enabled = Column(Boolean, default=False, nullable=False)
    mfa_secret = Column(String(255), nullable=True)
    
    # Notification preferences (JSON)
    notification_preferences = Column(Text, nullable=True)  # JSON: {email: true, sms: true, push: true}
    
    # Family management
    family_members = Column(Text, nullable=True)  # JSON array of family member IDs
    managed_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # For dependents
    
    # Doctor-specific fields
    rating_average = Column(Float, nullable=True)
    rating_count = Column(Integer, default=0, nullable=False)
    languages_spoken = Column(String(200), nullable=True)  # Comma-separated
    education = Column(Text, nullable=True)
    certifications = Column(Text, nullable=True)  # JSON array
    professional_memberships = Column(Text, nullable=True)
    accepting_new_patients = Column(Boolean, default=True, nullable=False)
    
    # Admin-specific fields
    admin_permissions = Column(Text, nullable=True)  # JSON object with granular permissions
    last_activity = Column(DateTime(timezone=True), nullable=True)
    
    # Device tracking for security
    registered_devices = Column(Text, nullable=True)  # JSON array of device IDs
    
    # GDPR and compliance
    data_processing_consent = Column(Boolean, default=False, nullable=False)
    marketing_consent = Column(Boolean, default=False, nullable=False)
    terms_accepted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Account status
    suspended = Column(Boolean, default=False, nullable=False)
    suspension_reason = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    appointments_as_patient = relationship(
        "Appointment",
        foreign_keys="Appointment.patient_id",
        back_populates="patient"
    )
    appointments_as_doctor = relationship(
        "Appointment",
        foreign_keys="Appointment.doctor_id",
        back_populates="doctor"
    )
    medical_records = relationship(
        "MedicalRecord",
        back_populates="patient"
    )
    notifications = relationship(
        "Notification",
        back_populates="user"
    )
    sent_messages = relationship(
        "Message",
        foreign_keys="Message.sender_id",
        back_populates="sender"
    )
    received_messages = relationship(
        "Message",
        foreign_keys="Message.recipient_id",
        back_populates="recipient"
    )
    
    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
    
    @property
    def full_name(self):
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"
