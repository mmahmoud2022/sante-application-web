"""
Notification model for managing user notifications
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class NotificationType(str, enum.Enum):
    """Notification type enumeration"""
    APPOINTMENT_REMINDER = "appointment_reminder"
    APPOINTMENT_CONFIRMED = "appointment_confirmed"
    APPOINTMENT_CANCELLED = "appointment_cancelled"
    APPOINTMENT_RESCHEDULED = "appointment_rescheduled"
    APPOINTMENT_DELAYED = "appointment_delayed"
    PRESCRIPTION_READY = "prescription_ready"
    PRESCRIPTION_RENEWAL = "prescription_renewal"
    VACCINATION_DUE = "vaccination_due"
    MESSAGE_RECEIVED = "message_received"
    PAYMENT_RECEIVED = "payment_received"
    PAYMENT_FAILED = "payment_failed"
    DOCUMENT_READY = "document_ready"
    SYSTEM_ALERT = "system_alert"


class NotificationChannel(str, enum.Enum):
    """Notification channel enumeration"""
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"


class NotificationStatus(str, enum.Enum):
    """Notification status enumeration"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    READ = "read"


class Notification(Base):
    """Notification model"""
    __tablename__ = "notifications"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Notification details
    notification_type = Column(
        SQLEnum(NotificationType),
        nullable=False,
        index=True
    )
    channel = Column(
        SQLEnum(NotificationChannel),
        nullable=False
    )
    status = Column(
        SQLEnum(NotificationStatus),
        default=NotificationStatus.PENDING,
        nullable=False,
        index=True
    )
    
    # Content
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    # Metadata
    reference_id = Column(Integer, nullable=True)  # Reference to related entity
    reference_type = Column(String(50), nullable=True)  # Type of related entity
    action_url = Column(String(500), nullable=True)
    
    # Scheduling
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    
    def __repr__(self):
        return f"<Notification {self.id} - {self.notification_type}>"
