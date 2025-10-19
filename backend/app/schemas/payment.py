"""
Payment schemas for request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal

from app.models.payment import PaymentMethod, PaymentStatus


class PaymentBase(BaseModel):
    """Base payment schema"""
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    currency: str = Field("EUR", min_length=3, max_length=3)
    payment_method: PaymentMethod
    description: Optional[str] = None


class PaymentCreate(PaymentBase):
    """Schema for creating a new payment"""
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    notes: Optional[str] = None


class PaymentUpdate(BaseModel):
    """Schema for updating payment"""
    status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = None


class PaymentRefund(BaseModel):
    """Schema for refunding payment"""
    refunded_amount: Decimal = Field(..., gt=0, decimal_places=2)
    refund_reason: str = Field(..., min_length=1)


class PaymentResponse(PaymentBase):
    """Schema for payment response"""
    id: int
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    status: PaymentStatus
    transaction_id: Optional[str] = None
    payment_gateway: Optional[str] = None
    refunded_amount: Decimal
    refund_reason: Optional[str] = None
    refunded_at: Optional[datetime] = None
    invoice_number: Optional[str] = None
    invoice_url: Optional[str] = None
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
