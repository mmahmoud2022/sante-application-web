"""
Document model for managing medical documents
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class DocumentType(str, enum.Enum):
    """Document type enumeration"""
    LAB_RESULT = "lab_result"
    PRESCRIPTION = "prescription"
    MEDICAL_IMAGE = "medical_image"
    REPORT = "report"
    INVOICE = "invoice"
    CONSENT_FORM = "consent_form"
    INSURANCE_DOCUMENT = "insurance_document"
    VACCINATION_CERTIFICATE = "vaccination_certificate"
    MEDICAL_CERTIFICATE = "medical_certificate"
    OTHER = "other"


class Document(Base):
    """Document model"""
    __tablename__ = "documents"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    
    # Document details
    document_type = Column(
        SQLEnum(DocumentType),
        nullable=False,
        index=True
    )
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # File information
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    
    # Access control
    is_shared = Column(Boolean, default=False, nullable=False)
    shared_with = Column(String(500), nullable=True)  # Comma-separated user IDs
    
    # OCR and processing
    ocr_text = Column(Text, nullable=True)
    ocr_processed = Column(Boolean, default=False, nullable=False)
    
    # Metadata
    document_date = Column(DateTime(timezone=True), nullable=True)
    tags = Column(String(500), nullable=True)  # Comma-separated tags
    
    # Verification
    verified = Column(Boolean, default=False, nullable=False)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    patient = relationship("User", foreign_keys=[patient_id])
    uploader = relationship("User", foreign_keys=[uploaded_by])
    appointment = relationship("Appointment")
    
    def __repr__(self):
        return f"<Document {self.id} - {self.title}>"
