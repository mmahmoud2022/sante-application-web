"""
Payment model for managing financial transactions
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Numeric, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class PaymentMethod(str, enum.Enum):
    """Payment method enumeration"""
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PAYPAL = "paypal"
    APPLE_PAY = "apple_pay"
    GOOGLE_PAY = "google_pay"
    BANK_TRANSFER = "bank_transfer"
    CASH = "cash"
    INSURANCE = "insurance"


class PaymentStatus(str, enum.Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"
    CANCELLED = "cancelled"


class Payment(Base):
    """Payment model"""
    __tablename__ = "payments"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    
    # Payment details
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="EUR", nullable=False)
    payment_method = Column(
        SQLEnum(PaymentMethod),
        nullable=False
    )
    status = Column(
        SQLEnum(PaymentStatus),
        default=PaymentStatus.PENDING,
        nullable=False,
        index=True
    )
    
    # Transaction information
    transaction_id = Column(String(200), nullable=True, unique=True, index=True)
    payment_gateway = Column(String(50), nullable=True)
    gateway_response = Column(Text, nullable=True)
    
    # Refund information
    refunded_amount = Column(Numeric(10, 2), default=0, nullable=False)
    refund_reason = Column(Text, nullable=True)
    refunded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Invoice information
    invoice_number = Column(String(100), nullable=True, unique=True, index=True)
    invoice_url = Column(String(500), nullable=True)
    
    # Payment description
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    payment_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])
    appointment = relationship("Appointment")
    
    def __repr__(self):
        return f"<Payment {self.id} - {self.amount} {self.currency}>"
