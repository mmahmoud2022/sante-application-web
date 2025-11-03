"""
Comprehensive error code system for the API
"""
from enum import Enum
from typing import Any, Dict, Optional


class ErrorCode(str, Enum):
    """Error codes for the API"""
    
    # Authentication & Authorization Errors (1xxx)
    INVALID_CREDENTIALS = "AUTH_1001"
    TOKEN_EXPIRED = "AUTH_1002"
    TOKEN_INVALID = "AUTH_1003"
    INSUFFICIENT_PERMISSIONS = "AUTH_1004"
    ACCOUNT_LOCKED = "AUTH_1005"
    ACCOUNT_INACTIVE = "AUTH_1006"
    EMAIL_NOT_VERIFIED = "AUTH_1007"
    WEAK_PASSWORD = "AUTH_1008"
    INVALID_ADMIN_SECRET = "AUTH_1009"
    
    # User Errors (2xxx)
    USER_NOT_FOUND = "USER_2001"
    USER_ALREADY_EXISTS = "USER_2002"
    INVALID_USER_ROLE = "USER_2003"
    INVALID_EMAIL = "USER_2004"
    INVALID_PHONE = "USER_2005"
    
    # Appointment Errors (3xxx)
    APPOINTMENT_NOT_FOUND = "APPOINTMENT_3001"
    SLOT_NOT_AVAILABLE = "APPOINTMENT_3002"
    APPOINTMENT_ALREADY_BOOKED = "APPOINTMENT_3003"
    INVALID_APPOINTMENT_STATUS = "APPOINTMENT_3004"
    APPOINTMENT_IN_PAST = "APPOINTMENT_3005"
    CANCELLATION_TOO_LATE = "APPOINTMENT_3006"
    APPOINTMENT_CONFLICT = "APPOINTMENT_3007"
    INVALID_APPOINTMENT_DATE = "APPOINTMENT_3008"
    DOCTOR_NOT_AVAILABLE = "APPOINTMENT_3009"
    
    # Schedule Errors (4xxx)
    SCHEDULE_NOT_FOUND = "SCHEDULE_4001"
    SCHEDULE_CONFLICT = "SCHEDULE_4002"
    INVALID_SCHEDULE_TIME = "SCHEDULE_4003"
    INVALID_SCHEDULE_DATE = "SCHEDULE_4004"
    
    # Prescription Errors (5xxx)
    PRESCRIPTION_NOT_FOUND = "PRESCRIPTION_5001"
    PRESCRIPTION_ALREADY_DELIVERED = "PRESCRIPTION_5002"
    INVALID_PRESCRIPTION_STATUS = "PRESCRIPTION_5003"
    PRESCRIPTION_EXPIRED = "PRESCRIPTION_5004"
    MEDICATION_NOT_FOUND = "PRESCRIPTION_5005"
    
    # Medical Record Errors (6xxx)
    MEDICAL_RECORD_NOT_FOUND = "MEDICAL_RECORD_6001"
    MEDICAL_RECORD_ACCESS_DENIED = "MEDICAL_RECORD_6002"
    INVALID_MEDICAL_RECORD_TYPE = "MEDICAL_RECORD_6003"
    
    # Document Errors (7xxx)
    DOCUMENT_NOT_FOUND = "DOCUMENT_7001"
    DOCUMENT_UPLOAD_FAILED = "DOCUMENT_7002"
    INVALID_DOCUMENT_TYPE = "DOCUMENT_7003"
    DOCUMENT_TOO_LARGE = "DOCUMENT_7004"
    DOCUMENT_PROCESSING_FAILED = "DOCUMENT_7005"
    
    # Notification Errors (8xxx)
    NOTIFICATION_NOT_FOUND = "NOTIFICATION_8001"
    NOTIFICATION_SEND_FAILED = "NOTIFICATION_8002"
    INVALID_NOTIFICATION_CHANNEL = "NOTIFICATION_8003"
    
    # Payment Errors (9xxx)
    PAYMENT_NOT_FOUND = "PAYMENT_9001"
    PAYMENT_FAILED = "PAYMENT_9002"
    INSUFFICIENT_FUNDS = "PAYMENT_9003"
    INVALID_PAYMENT_METHOD = "PAYMENT_9004"
    REFUND_FAILED = "PAYMENT_9005"
    
    # Review Errors (10xxx)
    REVIEW_NOT_FOUND = "REVIEW_10001"
    REVIEW_ALREADY_EXISTS = "REVIEW_10002"
    REVIEW_NOT_ALLOWED = "REVIEW_10003"
    INVALID_REVIEW_RATING = "REVIEW_10004"
    
    # Message Errors (11xxx)
    MESSAGE_NOT_FOUND = "MESSAGE_11001"
    MESSAGE_SEND_FAILED = "MESSAGE_11002"
    CONVERSATION_NOT_FOUND = "MESSAGE_11003"
    MESSAGE_RECIPIENT_INVALID = "MESSAGE_11004"
    
    # Waiting List Errors (12xxx)
    WAITING_LIST_NOT_FOUND = "WAITING_LIST_12001"
    ALREADY_ON_WAITING_LIST = "WAITING_LIST_12002"
    WAITING_LIST_FULL = "WAITING_LIST_12003"
    
    # Rate Limiting Errors (13xxx)
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_13001"
    TOO_MANY_REQUESTS = "RATE_LIMIT_13002"
    TOO_MANY_LOGIN_ATTEMPTS = "RATE_LIMIT_13003"
    
    # Validation Errors (14xxx)
    VALIDATION_ERROR = "VALIDATION_14001"
    INVALID_INPUT = "VALIDATION_14002"
    MISSING_REQUIRED_FIELD = "VALIDATION_14003"
    INVALID_DATE_FORMAT = "VALIDATION_14004"
    INVALID_TIME_FORMAT = "VALIDATION_14005"
    
    # General Errors (99xxx)
    INTERNAL_SERVER_ERROR = "GENERAL_99001"
    DATABASE_ERROR = "GENERAL_99002"
    EXTERNAL_SERVICE_ERROR = "GENERAL_99003"
    NOT_IMPLEMENTED = "GENERAL_99004"
    RESOURCE_NOT_FOUND = "GENERAL_99005"
    BAD_REQUEST = "GENERAL_99006"


class APIError(Exception):
    """
    Custom API exception with error code
    
    This exception should be raised throughout the application to provide
    consistent error handling and responses.
    """
    
    def __init__(
        self,
        code: ErrorCode,
        message: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize API error
        
        Args:
            code: Error code from ErrorCode enum
            message: Human-readable error message
            status_code: HTTP status code (default: 400)
            details: Optional additional error details
        """
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert error to dictionary for JSON response
        
        Returns:
            Dictionary representation of the error
        """
        error_dict = {
            "error": {
                "code": self.code.value,
                "message": self.message,
            }
        }
        
        if self.details:
            error_dict["error"]["details"] = self.details
        
        return error_dict
    
    def __str__(self) -> str:
        """String representation of the error"""
        return f"[{self.code.value}] {self.message}"
    
    def __repr__(self) -> str:
        """Representation of the error"""
        return f"APIError(code={self.code.value}, message={self.message}, status_code={self.status_code})"


# Convenience functions for common errors

def not_found_error(resource: str, identifier: Any) -> APIError:
    """Create a not found error"""
    return APIError(
        code=ErrorCode.RESOURCE_NOT_FOUND,
        message=f"{resource} not found",
        status_code=404,
        details={"resource": resource, "identifier": str(identifier)}
    )


def validation_error(message: str, field: Optional[str] = None) -> APIError:
    """Create a validation error"""
    details = {"field": field} if field else {}
    return APIError(
        code=ErrorCode.VALIDATION_ERROR,
        message=message,
        status_code=422,
        details=details
    )


def unauthorized_error(message: str = "Authentication required") -> APIError:
    """Create an unauthorized error"""
    return APIError(
        code=ErrorCode.INVALID_CREDENTIALS,
        message=message,
        status_code=401
    )


def forbidden_error(message: str = "Insufficient permissions") -> APIError:
    """Create a forbidden error"""
    return APIError(
        code=ErrorCode.INSUFFICIENT_PERMISSIONS,
        message=message,
        status_code=403
    )


def rate_limit_error(message: str = "Rate limit exceeded") -> APIError:
    """Create a rate limit error"""
    return APIError(
        code=ErrorCode.RATE_LIMIT_EXCEEDED,
        message=message,
        status_code=429
    )
