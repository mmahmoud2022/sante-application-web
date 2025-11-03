"""
Audit Log model for tracking user actions and system events
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class AuditLog(Base):
    """Model for storing audit trail of all user actions and system events"""
    __tablename__ = "audit_logs"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Action details
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100), nullable=True, index=True)
    resource_id = Column(Integer, nullable=True, index=True)
    
    # User information
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Request details
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    
    # Action outcome
    success = Column(Boolean, default=True, nullable=False, index=True)
    error_message = Column(Text, nullable=True)
    
    # Additional context (stored as JSON)
    details = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog {self.id} - {self.action} by User {self.user_id}>"
