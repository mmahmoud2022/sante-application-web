"""
Review and rating model for doctor reviews
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Review(Base):
    """Review and rating model"""
    __tablename__ = "reviews"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    
    # Rating (1-5 stars)
    rating = Column(Float, nullable=False)
    
    # Review content
    title = Column(String(200), nullable=True)
    review_text = Column(Text, nullable=True)
    
    # Verification
    verified_visit = Column(Boolean, default=False, nullable=False)
    
    # Doctor response
    doctor_response = Column(Text, nullable=True)
    doctor_response_date = Column(DateTime(timezone=True), nullable=True)
    
    # Moderation
    is_published = Column(Boolean, default=True, nullable=False)
    is_flagged = Column(Boolean, default=False, nullable=False)
    flagged_reason = Column(Text, nullable=True)
    moderated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    moderated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Helpful votes
    helpful_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationships
    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])
    appointment = relationship("Appointment")
    
    def __repr__(self):
        return f"<Review {self.id} - Rating: {self.rating}>"
