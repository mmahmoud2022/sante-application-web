# Error Handling Guide

## Overview

The Santé application uses a comprehensive error handling system with structured error codes, detailed logging, and consistent API responses.

## Error Code System

### Structure

Error codes follow the format: `CATEGORY_NUMBER`
- **CATEGORY**: Functional area (AUTH, USER, APPOINTMENT, etc.)
- **NUMBER**: Unique identifier within category

Example: `AUTH_1001` = Authentication error #1

### Complete Error Code Reference

#### Authentication & Authorization (AUTH_1xxx)
- `AUTH_1001` - Invalid credentials
- `AUTH_1002` - Token expired
- `AUTH_1003` - Token invalid
- `AUTH_1004` - Insufficient permissions
- `AUTH_1005` - Account locked
- `AUTH_1006` - Account inactive
- `AUTH_1007` - Email not verified
- `AUTH_1008` - Weak password
- `AUTH_1009` - Invalid admin secret

#### User Management (USER_2xxx)
- `USER_2001` - User not found
- `USER_2002` - User already exists
- `USER_2003` - Invalid user role
- `USER_2004` - Invalid email format
- `USER_2005` - Invalid phone number

#### Appointments (APPOINTMENT_3xxx)
- `APPOINTMENT_3001` - Appointment not found
- `APPOINTMENT_3002` - Slot not available
- `APPOINTMENT_3003` - Appointment already booked
- `APPOINTMENT_3004` - Invalid appointment status
- `APPOINTMENT_3005` - Appointment in the past
- `APPOINTMENT_3006` - Cancellation too late
- `APPOINTMENT_3007` - Appointment conflict
- `APPOINTMENT_3008` - Invalid appointment date
- `APPOINTMENT_3009` - Doctor not available

#### Schedules (SCHEDULE_4xxx)
- `SCHEDULE_4001` - Schedule not found
- `SCHEDULE_4002` - Schedule conflict
- `SCHEDULE_4003` - Invalid schedule time
- `SCHEDULE_4004` - Invalid schedule date

#### Prescriptions (PRESCRIPTION_5xxx)
- `PRESCRIPTION_5001` - Prescription not found
- `PRESCRIPTION_5002` - Prescription already delivered
- `PRESCRIPTION_5003` - Invalid prescription status
- `PRESCRIPTION_5004` - Prescription expired
- `PRESCRIPTION_5005` - Medication not found

#### Medical Records (MEDICAL_RECORD_6xxx)
- `MEDICAL_RECORD_6001` - Medical record not found
- `MEDICAL_RECORD_6002` - Access denied
- `MEDICAL_RECORD_6003` - Invalid record type

#### Documents (DOCUMENT_7xxx)
- `DOCUMENT_7001` - Document not found
- `DOCUMENT_7002` - Upload failed
- `DOCUMENT_7003` - Invalid document type
- `DOCUMENT_7004` - Document too large
- `DOCUMENT_7005` - Processing failed

#### Notifications (NOTIFICATION_8xxx)
- `NOTIFICATION_8001` - Notification not found
- `NOTIFICATION_8002` - Send failed
- `NOTIFICATION_8003` - Invalid notification channel

#### Payments (PAYMENT_9xxx)
- `PAYMENT_9001` - Payment not found
- `PAYMENT_9002` - Payment failed
- `PAYMENT_9003` - Insufficient funds
- `PAYMENT_9004` - Invalid payment method
- `PAYMENT_9005` - Refund failed

#### Reviews (REVIEW_10xxx)
- `REVIEW_10001` - Review not found
- `REVIEW_10002` - Review already exists
- `REVIEW_10003` - Review not allowed
- `REVIEW_10004` - Invalid rating

#### Messages (MESSAGE_11xxx)
- `MESSAGE_11001` - Message not found
- `MESSAGE_11002` - Send failed
- `MESSAGE_11003` - Conversation not found
- `MESSAGE_11004` - Invalid recipient

#### Waiting Lists (WAITING_LIST_12xxx)
- `WAITING_LIST_12001` - Waiting list not found
- `WAITING_LIST_12002` - Already on waiting list
- `WAITING_LIST_12003` - Waiting list full

#### Rate Limiting (RATE_LIMIT_13xxx)
- `RATE_LIMIT_13001` - Rate limit exceeded
- `RATE_LIMIT_13002` - Too many requests
- `RATE_LIMIT_13003` - Too many login attempts

#### Validation (VALIDATION_14xxx)
- `VALIDATION_14001` - Validation error
- `VALIDATION_14002` - Invalid input
- `VALIDATION_14003` - Missing required field
- `VALIDATION_14004` - Invalid date format
- `VALIDATION_14005` - Invalid time format

#### General Errors (GENERAL_99xxx)
- `GENERAL_99001` - Internal server error
- `GENERAL_99002` - Database error
- `GENERAL_99003` - External service error
- `GENERAL_99004` - Not implemented
- `GENERAL_99005` - Resource not found
- `GENERAL_99006` - Bad request

## API Error Responses

### Standard Format

All API errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "optional_additional_context"
    }
  }
}
```

### Examples

#### Authentication Error
```json
{
  "error": {
    "code": "AUTH_1001",
    "message": "Incorrect email or password",
    "details": {
      "remaining_attempts": 3,
      "warning": "Account will be locked after 3 more failed attempts"
    }
  }
}
```
HTTP Status: 401 Unauthorized

#### Validation Error
```json
{
  "error": {
    "code": "VALIDATION_14001",
    "message": "Password must be at least 12 characters long",
    "details": {
      "field": "password",
      "requirements": [
        "At least 12 characters long",
        "At least one uppercase letter"
      ]
    }
  }
}
```
HTTP Status: 422 Unprocessable Entity

#### Rate Limit Error
```json
{
  "error": {
    "code": "RATE_LIMIT_13001",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "max_requests": 10,
      "window_seconds": 900
    }
  }
}
```
HTTP Status: 429 Too Many Requests

#### Resource Not Found
```json
{
  "error": {
    "code": "APPOINTMENT_3001",
    "message": "Appointment not found",
    "details": {
      "resource": "appointment",
      "identifier": "123"
    }
  }
}
```
HTTP Status: 404 Not Found

## Usage in Code

### Raising Errors

```python
from app.core.errors import APIError, ErrorCode

# Basic error
raise APIError(
    code=ErrorCode.USER_NOT_FOUND,
    message="User not found",
    status_code=404
)

# Error with details
raise APIError(
    code=ErrorCode.APPOINTMENT_CONFLICT,
    message="Doctor already has an appointment at this time",
    status_code=409,
    details={
        "doctor_id": 5,
        "conflicting_appointment_id": 123,
        "time": "2025-02-01T14:00:00Z"
    }
)
```

### Convenience Functions

```python
from app.core.errors import (
    not_found_error,
    validation_error,
    unauthorized_error,
    forbidden_error,
    rate_limit_error
)

# Not found
raise not_found_error("User", user_id)

# Validation error
raise validation_error("Invalid email format", field="email")

# Unauthorized
raise unauthorized_error("Invalid token")

# Forbidden
raise forbidden_error("You don't have permission to access this resource")

# Rate limit
raise rate_limit_error("Too many login attempts")
```

### Catching Errors

```python
from app.core.errors import APIError, ErrorCode

try:
    # Some operation
    pass
except APIError as e:
    # Error is automatically handled by middleware
    # No need to catch in most cases
    raise
except Exception as e:
    # Convert to APIError
    raise APIError(
        code=ErrorCode.INTERNAL_SERVER_ERROR,
        message="An unexpected error occurred",
        status_code=500
    )
```

## Logging

### Structured Logging

All errors are logged with structured data:

```python
from app.core.logging import get_logger

logger = get_logger(__name__)

# Info log
logger.info(
    "User login successful",
    extra={
        "user_id": user.id,
        "email": user.email,
        "role": user.role
    }
)

# Warning log
logger.warning(
    "Failed login attempt",
    extra={
        "email": email,
        "ip_address": client_ip,
        "failed_attempts": 3
    }
)

# Error log
logger.error(
    "Database connection failed",
    extra={
        "error": str(e),
        "database": "postgresql"
    },
    exc_info=True  # Include stack trace
)
```

### Log Levels

- `DEBUG`: Detailed debugging information
- `INFO`: General informational messages
- `WARNING`: Warning messages (e.g., failed login attempts)
- `ERROR`: Error messages (e.g., database errors)
- `CRITICAL`: Critical errors (e.g., system failures)

### Request Correlation

All logs include request ID for tracing:

```
{
  "timestamp": 1706712000.123,
  "level": "ERROR",
  "name": "app.api.v1.endpoints.auth",
  "message": "Database connection failed",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "error": "connection timeout"
}
```

## Error Tracking

### Sentry Integration

For production error tracking, integrate Sentry:

```python
# In app/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    environment=settings.ENVIRONMENT,
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
)
```

### Error Context

Sentry automatically captures:
- Request ID
- User information
- Request parameters
- Stack traces
- Environment details

## Best Practices

### For Developers

1. **Use Appropriate Error Codes**
   ```python
   # Good
   raise APIError(
       code=ErrorCode.APPOINTMENT_NOT_FOUND,
       message="Appointment not found",
       status_code=404
   )
   
   # Bad
   raise HTTPException(status_code=404, detail="Not found")
   ```

2. **Provide Context in Details**
   ```python
   # Good
   raise APIError(
       code=ErrorCode.SLOT_NOT_AVAILABLE,
       message="The requested time slot is not available",
       status_code=409,
       details={
           "requested_time": "2025-02-01T14:00:00Z",
           "next_available": "2025-02-01T15:00:00Z"
       }
   )
   
   # Bad
   raise APIError(
       code=ErrorCode.SLOT_NOT_AVAILABLE,
       message="Not available",
       status_code=409
   )
   ```

3. **Log Before Raising Critical Errors**
   ```python
   try:
       result = database_operation()
   except Exception as e:
       logger.error(
           "Database operation failed",
           extra={"operation": "user_create", "error": str(e)},
           exc_info=True
       )
       raise APIError(
           code=ErrorCode.DATABASE_ERROR,
           message="Database operation failed",
           status_code=500
       )
   ```

4. **Don't Expose Sensitive Information**
   ```python
   # Good
   raise APIError(
       code=ErrorCode.INVALID_CREDENTIALS,
       message="Incorrect email or password",
       status_code=401
   )
   
   # Bad - reveals which field is wrong
   raise APIError(
       code=ErrorCode.INVALID_CREDENTIALS,
       message="Email is correct but password is wrong",
       status_code=401
   )
   ```

### For Frontend Developers

1. **Check Error Codes, Not Messages**
   ```javascript
   // Good
   if (error.error.code === 'AUTH_1001') {
       showLoginError();
   }
   
   // Bad
   if (error.error.message.includes('password')) {
       showLoginError();
   }
   ```

2. **Display User-Friendly Messages**
   ```javascript
   const errorMessages = {
       'AUTH_1001': 'Email ou mot de passe incorrect',
       'AUTH_1005': 'Compte temporairement verrouillé',
       'RATE_LIMIT_13001': 'Trop de tentatives. Réessayez plus tard.'
   };
   
   const userMessage = errorMessages[error.error.code] || 'Une erreur est survenue';
   ```

3. **Handle Rate Limiting**
   ```javascript
   if (error.status === 429) {
       const retryAfter = error.error.details.window_seconds;
       showRateLimitMessage(retryAfter);
   }
   ```

## Testing

### Testing Error Handling

```python
import pytest
from app.core.errors import APIError, ErrorCode

def test_api_error_creation():
    error = APIError(
        code=ErrorCode.USER_NOT_FOUND,
        message="User not found",
        status_code=404
    )
    assert error.status_code == 404
    assert error.code == ErrorCode.USER_NOT_FOUND

def test_api_error_serialization():
    error = APIError(
        code=ErrorCode.VALIDATION_ERROR,
        message="Invalid input",
        status_code=422,
        details={"field": "email"}
    )
    error_dict = error.to_dict()
    assert error_dict["error"]["code"] == "VALIDATION_14001"
    assert error_dict["error"]["details"]["field"] == "email"
```

## Monitoring and Alerts

### Metrics to Track

1. Error rate by error code
2. Error rate by endpoint
3. 5xx errors (critical)
4. 4xx errors (client errors)
5. Average response time
6. Error distribution over time

### Alert Thresholds

- **Critical**: 5xx error rate > 1%
- **High**: Authentication failures > 100/hour
- **Medium**: Rate limit violations > 50/hour
- **Low**: 4xx error rate > 10%

## Troubleshooting

### Common Issues

#### Missing Request ID in Logs
**Problem**: Request ID shows as 'N/A'
**Solution**: Ensure RequestLoggingMiddleware is added to app

#### Errors Not Being Caught
**Problem**: Errors bypass error handler
**Solution**: Ensure APIError is raised, not HTTPException

#### Details Not Showing in Response
**Problem**: Details field is empty
**Solution**: Pass details as dict when creating APIError

## References

- [Error Code Enum](../app/core/errors.py)
- [API Error Class](../app/core/errors.py)
- [Request Logging](../app/core/middleware.py)
- [Structured Logging](../app/core/logging.py)
