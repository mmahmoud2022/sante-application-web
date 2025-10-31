# Security Features Documentation

## Overview

This document describes the security features implemented in the Santé application, including password policies, rate limiting, account lockout, and error handling.

## Password Policy

### Requirements

All user passwords must meet the following requirements:
- Minimum 12 characters long
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (!@#$%^&*(),.?":{}|<>)
- Not a commonly used password

### Implementation

Password validation is enforced at registration using the `PasswordPolicy` class:

```python
from app.core.password_policy import validate_password_strength

is_valid, message = validate_password_strength(password)
if not is_valid:
    # Handle invalid password
    pass
```

### API Endpoint

Get password requirements:
```
GET /api/v1/auth/password-requirements
```

Response:
```json
{
  "requirements": [
    "At least 12 characters long",
    "At least one uppercase letter (A-Z)",
    "At least one lowercase letter (a-z)",
    "At least one digit (0-9)",
    "At least one special character (!@#$%^&*(),.?\":{}|<>)",
    "Not a commonly used password"
  ],
  "policy": {
    "min_length": 12,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_digit": true,
    "require_special_char": true,
    "special_chars": "!@#$%^&*(),.?\":{}|<>"
  }
}
```

## Rate Limiting

### Configuration

Rate limiting is implemented using Redis and protects against abuse:

| Endpoint | Limit | Window | Description |
|----------|-------|--------|-------------|
| `/auth/login` | 10 requests | 15 minutes | Prevents brute force attacks |
| `/auth/register` | 5 requests | 1 hour | Prevents spam registrations |

### Implementation

Rate limiting uses Redis to track request counts:

```python
from app.core.security import get_rate_limiter

rate_limiter = get_rate_limiter()
await rate_limiter.check_rate_limit(
    key=f"login:{client_ip}",
    max_requests=10,
    window=900  # 15 minutes in seconds
)
```

### Response

When rate limit is exceeded:
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

## Account Lockout

### Policy

To prevent brute force attacks, accounts are temporarily locked after multiple failed login attempts:

- **Max Attempts**: 5 failed login attempts
- **Lockout Duration**: 15 minutes
- **Tracking**: By email address
- **Storage**: Redis

### Behavior

1. After each failed login attempt, counter is incremented
2. When counter reaches 5, account is locked
3. All login attempts during lockout return error
4. After 15 minutes, counter is reset
5. Successful login resets counter immediately

### Implementation

```python
from app.core.security import get_account_lockout

account_lockout = get_account_lockout()

# Check if locked
if account_lockout.is_locked_out(email):
    # Return error
    pass

# Record failed attempt
failed_attempts = account_lockout.record_failed_attempt(email)

# Reset on success
account_lockout.reset_attempts(email)
```

### Response

When account is locked:
```json
{
  "error": {
    "code": "AUTH_1005",
    "message": "Account temporarily locked due to multiple failed login attempts",
    "details": {
      "lockout_remaining_seconds": 600,
      "lockout_remaining_minutes": 10
    }
  }
}
```

HTTP Status: 429 Too Many Requests

## Error Handling

### Error Code System

All errors use structured error codes for consistent handling:

Format: `CATEGORY_NUMBER`
- Example: `AUTH_1001` (Authentication error)

### Categories

| Category | Code Range | Description |
|----------|------------|-------------|
| Authentication | AUTH_1xxx | Login, token, permissions |
| User | USER_2xxx | User management |
| Appointment | APPOINTMENT_3xxx | Appointments |
| Schedule | SCHEDULE_4xxx | Doctor schedules |
| Prescription | PRESCRIPTION_5xxx | Prescriptions |
| Medical Record | MEDICAL_RECORD_6xxx | Medical records |
| Document | DOCUMENT_7xxx | File uploads |
| Notification | NOTIFICATION_8xxx | Notifications |
| Payment | PAYMENT_9xxx | Payments |
| Review | REVIEW_10xxx | Reviews |
| Message | MESSAGE_11xxx | Messaging |
| Waiting List | WAITING_LIST_12xxx | Waiting lists |
| Rate Limit | RATE_LIMIT_13xxx | Rate limiting |
| Validation | VALIDATION_14xxx | Input validation |
| General | GENERAL_99xxx | General errors |

### Usage

```python
from app.core.errors import APIError, ErrorCode

# Raise structured error
raise APIError(
    code=ErrorCode.INVALID_CREDENTIALS,
    message="Incorrect email or password",
    status_code=401,
    details={"remaining_attempts": 3}
)
```

### Response Format

```json
{
  "error": {
    "code": "AUTH_1001",
    "message": "Incorrect email or password",
    "details": {
      "remaining_attempts": 3
    }
  }
}
```

## Logging

### Structured Logging

All requests are logged with correlation IDs:

```
{
  "timestamp": 1706712000.123,
  "level": "INFO",
  "name": "app.api.v1.endpoints.auth",
  "message": "Successful login: user@example.com",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": 123,
  "role": "patient"
}
```

### Request ID Tracking

Each request gets a unique ID for tracking:
- Auto-generated if not provided
- Can be specified via `X-Request-ID` header
- Included in all logs and error responses
- Returned in `X-Request-ID` response header

## Security Best Practices

### For Developers

1. **Always use APIError** for error handling
2. **Never log sensitive data** (passwords, tokens)
3. **Validate all inputs** before processing
4. **Use rate limiting** for all public endpoints
5. **Check authentication** for protected routes

### For Administrators

1. **Monitor failed login attempts** in logs
2. **Review rate limit metrics** regularly
3. **Keep Redis updated** for security patches
4. **Rotate secrets regularly** (JWT secret, API keys)
5. **Enable HTTPS** in production

## Configuration

### Environment Variables

```bash
# Security
SECRET_KEY=your-secret-key-min-32-characters
ADMIN_SECRET=admin-registration-secret

# Redis (for rate limiting)
REDIS_URL=redis://localhost:6379/0

# JWT Tokens
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Production Recommendations

1. Use strong, randomly generated secrets
2. Enable Redis persistence
3. Configure Redis authentication
4. Use Redis Sentinel for high availability
5. Enable audit logging
6. Integrate with Sentry for error tracking

## Monitoring

### Key Metrics to Monitor

1. Failed login attempts per hour
2. Account lockout events
3. Rate limit violations
4. Password reset requests
5. Error rates by error code

### Alerts

Set up alerts for:
- Spike in failed logins (potential attack)
- Multiple account lockouts (potential attack)
- High rate limit violations
- Critical errors (GENERAL_99001)

## Compliance

### GDPR

- Password resets expire after 15 minutes
- Account lockouts are temporary (15 minutes)
- Failed login attempts not permanently stored
- User can request account deletion

### Security Standards

- OWASP Top 10 compliance
- PCI DSS password requirements met
- NIST password guidelines followed

## Testing

### Security Test Cases

```bash
# Run security tests
pytest tests/test_security_improvements.py -v

# Test password policy
pytest tests/test_security_improvements.py::TestPasswordPolicy -v

# Test rate limiting (requires Redis)
pytest tests/test_security_improvements.py::TestRateLimiting -v
```

## Troubleshooting

### Redis Connection Issues

If Redis is unavailable:
- Rate limiting is disabled (allows all requests)
- Account lockout is disabled
- Application continues to function
- Warning logged

### Account Lockout Reset

To manually unlock an account:
```python
from app.core.security import get_account_lockout

account_lockout = get_account_lockout()
account_lockout.reset_attempts("user@example.com")
```

Or via Redis CLI:
```bash
redis-cli DEL "lockout:user@example.com"
```

## Future Enhancements

1. Two-factor authentication (2FA)
2. Biometric authentication support
3. OAuth2 integration (Google, Facebook)
4. IP-based geolocation restrictions
5. Device fingerprinting
6. Anomaly detection for suspicious logins
