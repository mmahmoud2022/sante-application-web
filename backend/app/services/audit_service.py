"""
Audit Logging Service
Tracks user actions and system events for compliance and security
"""
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from enum import Enum
import json


class AuditAction(str, Enum):
    """Enumeration of auditable actions"""
    # User actions
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_REGISTER = "user_register"
    USER_UPDATE = "user_update"
    USER_DELETE = "user_delete"
    PASSWORD_RESET = "password_reset"
    
    # Appointment actions
    APPOINTMENT_CREATE = "appointment_create"
    APPOINTMENT_UPDATE = "appointment_update"
    APPOINTMENT_CANCEL = "appointment_cancel"
    APPOINTMENT_CONFIRM = "appointment_confirm"
    APPOINTMENT_COMPLETE = "appointment_complete"
    
    # Medical records
    RECORD_CREATE = "record_create"
    RECORD_VIEW = "record_view"
    RECORD_UPDATE = "record_update"
    RECORD_DELETE = "record_delete"
    RECORD_SHARE = "record_share"
    
    # Prescription actions
    PRESCRIPTION_CREATE = "prescription_create"
    PRESCRIPTION_UPDATE = "prescription_update"
    PRESCRIPTION_RENEW = "prescription_renew"
    
    # Admin actions
    ADMIN_USER_ACTIVATE = "admin_user_activate"
    ADMIN_USER_DEACTIVATE = "admin_user_deactivate"
    ADMIN_USER_VERIFY = "admin_user_verify"
    ADMIN_CONFIG_CHANGE = "admin_config_change"
    
    # System events
    SYSTEM_ERROR = "system_error"
    SYSTEM_BACKUP = "system_backup"
    SYSTEM_RESTORE = "system_restore"


class AuditLogService:
    """Service for logging auditable events"""

    def __init__(self, db: Session):
        self.db = db

    def log(
        self,
        action: AuditAction,
        user_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True,
        error_message: Optional[str] = None,
    ):
        """
        Log an audit event
        
        Args:
            action: The action being performed
            user_id: ID of the user performing the action
            resource_type: Type of resource being acted upon
            resource_id: ID of the resource
            details: Additional details about the action
            ip_address: IP address of the client
            user_agent: User agent string
            success: Whether the action was successful
            error_message: Error message if action failed
        """
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "action": action.value,
            "user_id": user_id,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent,
            "success": success,
            "error_message": error_message,
        }
        
        # In production, you would:
        # 1. Store in database (create AuditLog model)
        # 2. Send to centralized logging (ELK, Splunk, etc.)
        # 3. Store in time-series database (InfluxDB, TimescaleDB)
        
        # For now, log to console and could be extended to file
        self._write_to_log(log_entry)

    def log_user_login(self, user_id: int, ip_address: str, user_agent: str, success: bool = True):
        """Log user login attempt"""
        self.log(
            action=AuditAction.USER_LOGIN,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
        )

    def log_user_action(
        self,
        action: AuditAction,
        user_id: int,
        resource_type: str,
        resource_id: int,
        details: Optional[Dict[str, Any]] = None,
    ):
        """Log a user action on a resource"""
        self.log(
            action=action,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
        )

    def log_admin_action(
        self,
        action: AuditAction,
        admin_id: int,
        target_user_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        """Log an administrative action"""
        self.log(
            action=action,
            user_id=admin_id,
            resource_type="user",
            resource_id=target_user_id,
            details=details,
        )

    def log_data_access(
        self,
        user_id: int,
        resource_type: str,
        resource_id: int,
        action: str = "view",
    ):
        """
        Log data access for compliance (GDPR, HIPAA)
        Important for medical records
        """
        self.log(
            action=AuditAction.RECORD_VIEW if action == "view" else AuditAction.RECORD_UPDATE,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            details={
                "access_type": action,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    def log_security_event(
        self,
        event_type: str,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        success: bool = False,
    ):
        """
        Log security-related events
        Examples: failed login attempts, unauthorized access, suspicious activity
        """
        self.log(
            action=AuditAction.SYSTEM_ERROR,
            user_id=user_id,
            resource_type="security",
            ip_address=ip_address,
            details={
                "event_type": event_type,
                **(details or {}),
            },
            success=success,
        )

    def _write_to_log(self, log_entry: Dict[str, Any]):
        """
        Write log entry to storage
        
        In production, this would:
        - Write to database for queryability
        - Write to log file for persistence
        - Send to centralized logging system
        - Trigger alerts for critical events
        """
        # Format log entry
        log_line = json.dumps(log_entry, default=str)
        
        # Console output (development)
        print(f"[AUDIT] {log_line}")
        
        # TODO: Add file logging
        # with open('/var/log/sante/audit.log', 'a') as f:
        #     f.write(log_line + '\n')
        
        # TODO: Send to centralized logging
        # elasticsearch_client.index(index='audit-logs', body=log_entry)
        
        # TODO: Store in database
        # audit_log = AuditLog(**log_entry)
        # self.db.add(audit_log)
        # self.db.commit()

    def get_user_activity(self, user_id: int, limit: int = 100):
        """
        Get recent activity for a user
        
        In production, this would query the audit log database
        """
        # Placeholder - would query actual audit log storage
        return {
            "user_id": user_id,
            "note": "Audit logs would be retrieved from storage here",
            "limit": limit,
        }

    def get_resource_history(self, resource_type: str, resource_id: int):
        """
        Get audit history for a specific resource
        
        Useful for tracking changes to medical records, prescriptions, etc.
        """
        # Placeholder - would query actual audit log storage
        return {
            "resource_type": resource_type,
            "resource_id": resource_id,
            "note": "Resource history would be retrieved from storage here",
        }


def get_audit_service(db: Session) -> AuditLogService:
    """Factory function to get audit logging service instance"""
    return AuditLogService(db)


# Decorator for automatic audit logging
def audit_log(action: AuditAction):
    """
    Decorator to automatically log function calls
    
    Usage:
        @audit_log(AuditAction.APPOINTMENT_CREATE)
        def create_appointment(...):
            ...
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Extract db and user_id from kwargs if present
            db = kwargs.get('db')
            user_id = kwargs.get('user_id')
            
            try:
                result = func(*args, **kwargs)
                
                if db and user_id:
                    audit_service = AuditLogService(db)
                    audit_service.log(
                        action=action,
                        user_id=user_id,
                        success=True,
                    )
                
                return result
            except Exception as e:
                if db and user_id:
                    audit_service = AuditLogService(db)
                    audit_service.log(
                        action=action,
                        user_id=user_id,
                        success=False,
                        error_message=str(e),
                    )
                raise
        
        return wrapper
    return decorator
