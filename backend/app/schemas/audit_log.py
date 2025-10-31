"""
Audit Log schemas
"""
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    """Response schema for audit log entries"""
    id: int
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    user_id: Optional[int] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool
    error_message: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
