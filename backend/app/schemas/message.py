"""
Message schemas for request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class MessageBase(BaseModel):
    """Base message schema"""
    subject: Optional[str] = Field(None, max_length=200)
    content: str = Field(..., min_length=1)


class MessageCreate(MessageBase):
    """Schema for creating a new message"""
    recipient_id: int
    reference_id: Optional[int] = None
    reference_type: Optional[str] = Field(None, max_length=50)


class MessageUpdate(BaseModel):
    """Schema for updating a message"""
    is_read: Optional[bool] = None
    read_at: Optional[datetime] = None


class MessageResponse(MessageBase):
    """Schema for message response"""
    id: int
    sender_id: int
    recipient_id: int
    is_read: bool
    read_at: Optional[datetime] = None
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    """Schema for conversation summary"""
    other_user_id: int
    other_user_name: str
    other_user_role: str
    last_message: Optional[MessageResponse] = None
    unread_count: int
    
    model_config = ConfigDict(from_attributes=True)
