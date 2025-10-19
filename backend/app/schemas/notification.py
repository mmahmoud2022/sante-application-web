"""
Notification schemas for request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

from app.models.notification import NotificationType, NotificationChannel, NotificationStatus


class NotificationBase(BaseModel):
    """Base notification schema"""
    notification_type: NotificationType
    channel: NotificationChannel
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)


class NotificationCreate(NotificationBase):
    """Schema for creating a new notification"""
    user_id: int
    reference_id: Optional[int] = None
    reference_type: Optional[str] = Field(None, max_length=50)
    action_url: Optional[str] = Field(None, max_length=500)
    scheduled_for: Optional[datetime] = None


class NotificationUpdate(BaseModel):
    """Schema for updating notification"""
    status: Optional[NotificationStatus] = None
    read_at: Optional[datetime] = None


class NotificationResponse(NotificationBase):
    """Schema for notification response"""
    id: int
    user_id: int
    status: NotificationStatus
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    action_url: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
