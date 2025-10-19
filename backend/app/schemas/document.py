"""
Document schemas for request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

from app.models.document import DocumentType


class DocumentBase(BaseModel):
    """Base document schema"""
    document_type: DocumentType
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None


class DocumentCreate(DocumentBase):
    """Schema for creating a new document"""
    patient_id: int
    uploaded_by: Optional[int] = None
    appointment_id: Optional[int] = None
    file_name: str = Field(..., min_length=1, max_length=255)
    file_path: str = Field(..., min_length=1, max_length=500)
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = Field(None, max_length=100)
    document_date: Optional[datetime] = None
    tags: Optional[str] = Field(None, max_length=500)


class DocumentUpdate(BaseModel):
    """Schema for updating document"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    is_shared: Optional[bool] = None
    shared_with: Optional[str] = Field(None, max_length=500)
    tags: Optional[str] = Field(None, max_length=500)


class DocumentResponse(DocumentBase):
    """Schema for document response"""
    id: int
    patient_id: int
    uploaded_by: Optional[int] = None
    appointment_id: Optional[int] = None
    file_name: str
    file_path: str
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    is_shared: bool
    shared_with: Optional[str] = None
    ocr_text: Optional[str] = None
    ocr_processed: bool
    document_date: Optional[datetime] = None
    tags: Optional[str] = None
    verified: bool
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
