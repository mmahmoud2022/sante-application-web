"""
Audit log query endpoints
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user, check_user_role
from app.models.user import User, UserRole
from app.schemas.audit_log import AuditLogResponse
from app.services.audit_service import get_audit_service

router = APIRouter()


@router.get("/my-activity", response_model=List[AuditLogResponse])
def get_my_activity(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get audit logs for the current user
    
    Returns the user's own activity history
    """
    audit_service = get_audit_service(db)
    logs = audit_service.get_user_activity(
        user_id=current_user.id,
        limit=limit,
        skip=skip
    )
    return logs


@router.get("/user/{user_id}", response_model=List[AuditLogResponse])
def get_user_activity(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(check_user_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Get audit logs for a specific user (admin only)
    
    Returns activity history for the specified user
    """
    audit_service = get_audit_service(db)
    logs = audit_service.get_user_activity(
        user_id=user_id,
        limit=limit,
        skip=skip
    )
    return logs


@router.get("/resource/{resource_type}/{resource_id}", response_model=List[AuditLogResponse])
def get_resource_history(
    resource_type: str,
    resource_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get audit history for a specific resource
    
    Useful for tracking changes to medical records, prescriptions, etc.
    Admin-only endpoint for security and privacy
    """
    # Only admins can view resource audit history
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view resource audit history"
        )
    
    audit_service = get_audit_service(db)
    logs = audit_service.get_resource_history(
        resource_type=resource_type,
        resource_id=resource_id,
        limit=limit,
        skip=skip
    )
    return logs


@router.get("/search", response_model=List[AuditLogResponse])
def search_audit_logs(
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    success: Optional[bool] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(check_user_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Search audit logs with filters (admin only)
    
    Useful for compliance reporting, security investigations, and data access tracking
    """
    audit_service = get_audit_service(db)
    logs = audit_service.search_audit_logs(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        success=success,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        skip=skip
    )
    return logs
