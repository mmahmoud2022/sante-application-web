# Backend Improvements and Feature Additions

**Date**: October 31, 2025  
**Project**: Santé Medical Application  
**Technology**: FastAPI, Python 3.11+, SQLAlchemy, PostgreSQL

---

## 📋 Executive Summary

This document outlines **necessary improvements** and **possible feature additions** for the backend of the Santé Medical Application. The improvements are prioritized and categorized for systematic implementation.

### Statistics
- **Critical Issues**: 8 items requiring immediate attention
- **High Priority Improvements**: 15 items
- **Medium Priority Enhancements**: 12 items
- **Feature Additions**: 20 new features proposed

---

## 🔴 Critical Issues (Priority 1 - Immediate Action Required)

### 1. **API Consistency with Frontend**
**Status**: ⚠️ Critical inconsistencies identified  
**Impact**: Causes runtime errors, failed API calls, poor UX

**Issues**:
- `AppointmentType` enum mismatch (backend: `video_call`, frontend expects: `video`)
- Field naming inconsistencies (`reason` vs `chief_complaint`, `phone` vs `phone_number`)
- Missing fields in response schemas (appointment cancellation details, notification types)
- Inconsistent data types (allergies as List[str] vs string)

**Required Actions**:
1. Standardize all enum values across backend and frontend
2. Align field names in schemas with frontend types
3. Complete all response schemas with missing fields
4. Add comprehensive API contract tests

**Files to Update**:
- `backend/app/schemas/appointment.py`
- `backend/app/schemas/user.py`
- `backend/app/schemas/medical_record.py`
- `backend/app/models/notification.py`

**Estimated Effort**: 2-3 days

---

### 2. **Missing Error Handling and Logging**
**Status**: ⚠️ Insufficient error tracking  
**Impact**: Difficult to debug production issues

**Issues**:
- No structured logging in many endpoints
- Generic error responses without proper error codes
- Missing request ID tracking
- No error monitoring integration

**Required Actions**:
1. Implement structured logging with correlation IDs
2. Define comprehensive error code system
3. Add request/response logging middleware
4. Integrate with error tracking service (Sentry, Rollbar)

**Implementation**:
```python
# backend/app/core/logging.py
import logging
import uuid
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar('request_id', default=None)

class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id_var.get()
        return True

# backend/app/core/errors.py
from enum import Enum

class ErrorCode(str, Enum):
    APPOINTMENT_NOT_FOUND = "APPOINTMENT_NOT_FOUND"
    SLOT_NOT_AVAILABLE = "SLOT_NOT_AVAILABLE"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    # ... more error codes

class APIError(Exception):
    def __init__(self, code: ErrorCode, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
```

**Estimated Effort**: 3-4 days

---

### 3. **Security Vulnerabilities**
**Status**: ⚠️ Several security gaps identified  
**Impact**: Potential data breaches, unauthorized access

**Issues**:
- No rate limiting on authentication endpoints
- Missing CSRF protection for state-changing operations
- Weak password policy enforcement
- No account lockout mechanism after failed login attempts
- Missing input sanitization in several endpoints
- No SQL injection prevention audits

**Required Actions**:
1. Implement rate limiting (using Redis)
2. Add CSRF token validation
3. Enforce strong password policy (min 12 chars, complexity requirements)
4. Implement account lockout (5 failed attempts, 15-minute lockout)
5. Add input sanitization middleware
6. Conduct security audit of all SQL queries

**Implementation**:
```python
# backend/app/core/security.py
from fastapi import Request, HTTPException
from redis import Redis
import time

class RateLimiter:
    def __init__(self, redis: Redis):
        self.redis = redis
    
    async def check_rate_limit(self, key: str, max_requests: int, window: int):
        current = self.redis.get(key)
        if current and int(current) >= max_requests:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        pipe = self.redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        pipe.execute()

# backend/app/core/password_policy.py
import re

def validate_password_strength(password: str) -> tuple[bool, str]:
    if len(password) < 12:
        return False, "Password must be at least 12 characters long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    return True, "Password is strong"
```

**Estimated Effort**: 4-5 days

---

### 4. **Missing Database Indexes**
**Status**: ⚠️ Performance degradation on large datasets  
**Impact**: Slow queries, poor scalability

**Issues**:
- No indexes on foreign keys
- Missing composite indexes for common queries
- No indexes on frequently filtered fields (status, date, user_id)

**Required Actions**:
1. Add indexes on all foreign keys
2. Create composite indexes for common query patterns
3. Add indexes on status fields and date columns
4. Analyze query performance and add covering indexes

**Implementation**:
```python
# backend/alembic/versions/xxx_add_performance_indexes.py
def upgrade():
    # Foreign key indexes
    op.create_index('ix_appointments_patient_id', 'appointments', ['patient_id'])
    op.create_index('ix_appointments_doctor_id', 'appointments', ['doctor_id'])
    
    # Composite indexes
    op.create_index(
        'ix_appointments_doctor_date_status',
        'appointments',
        ['doctor_id', 'appointment_date', 'status']
    )
    
    # Status and date indexes
    op.create_index('ix_appointments_status', 'appointments', ['status'])
    op.create_index('ix_appointments_date', 'appointments', ['appointment_date'])
    
    # User lookup indexes
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_role', 'users', ['role'])
```

**Estimated Effort**: 1-2 days

---

### 5. **Incomplete Email/SMS Integration**
**Status**: ⚠️ TODO comments, no actual implementation  
**Impact**: Critical features non-functional (notifications, 2FA)

**Issues**:
- Email service has TODO placeholders
- SMS service not implemented
- No notification delivery tracking
- No email template system

**Required Actions**:
1. Integrate email service (SendGrid, AWS SES, or Postmark)
2. Integrate SMS service (Twilio, AWS SNS)
3. Implement email templates with i18n support
4. Add notification delivery status tracking
5. Implement retry logic for failed notifications

**Implementation**:
```python
# backend/app/services/email_service.py
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import logging

class EmailService:
    def __init__(self, api_key: str):
        self.client = SendGridAPIClient(api_key)
        self.logger = logging.getLogger(__name__)
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        from_email: str = "noreply@sante-app.com"
    ):
        message = Mail(
            from_email=from_email,
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )
        try:
            response = self.client.send(message)
            self.logger.info(f"Email sent to {to_email}, status: {response.status_code}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

# backend/app/templates/email_templates.py
class EmailTemplates:
    APPOINTMENT_CONFIRMATION = """
    <h2>Appointment Confirmation</h2>
    <p>Dear {patient_name},</p>
    <p>Your appointment with Dr. {doctor_name} is confirmed.</p>
    <p><strong>Date:</strong> {appointment_date}</p>
    <p><strong>Time:</strong> {appointment_time}</p>
    <p>If you need to cancel, please do so at least 24 hours in advance.</p>
    """
```

**Estimated Effort**: 3-4 days

---

### 6. **Missing API Versioning Strategy**
**Status**: ⚠️ Inconsistent versioning  
**Impact**: Breaking changes will affect all clients

**Issues**:
- Only v1 exists, no deprecation strategy
- No API version negotiation
- Missing version headers

**Required Actions**:
1. Implement proper API versioning headers
2. Create deprecation policy
3. Add version negotiation middleware
4. Document versioning strategy

**Implementation**:
```python
# backend/app/api/versioning.py
from fastapi import Header, HTTPException

async def validate_api_version(
    api_version: str = Header(default="v1", alias="X-API-Version")
):
    supported_versions = ["v1", "v2"]
    if api_version not in supported_versions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported API version. Supported versions: {supported_versions}"
        )
    return api_version
```

**Estimated Effort**: 2 days

---

### 7. **Insufficient Test Coverage**
**Status**: ⚠️ Only 6 test files, low coverage  
**Impact**: Bugs in production, difficult refactoring

**Current Coverage**: ~30% (estimated)  
**Target Coverage**: 80%+

**Required Actions**:
1. Add unit tests for all services (target 90%+ coverage)
2. Add integration tests for all API endpoints
3. Add fixture factories for test data
4. Implement property-based testing for complex logic
5. Add performance/load tests

**Implementation**:
```python
# backend/tests/factories.py
from factory import Factory, Faker, SubFactory
from app.models import User, Appointment

class UserFactory(Factory):
    class Meta:
        model = User
    
    email = Faker('email')
    full_name = Faker('name')
    role = 'patient'
    is_active = True

class AppointmentFactory(Factory):
    class Meta:
        model = Appointment
    
    patient = SubFactory(UserFactory)
    doctor = SubFactory(UserFactory, role='doctor')
    appointment_date = Faker('date_time_this_month')
    status = 'scheduled'

# backend/tests/test_appointments_service.py
import pytest
from tests.factories import AppointmentFactory, UserFactory

class TestAppointmentService:
    async def test_create_appointment_success(self, db_session):
        patient = UserFactory.create()
        doctor = UserFactory.create(role='doctor')
        appointment = await create_appointment(...)
        assert appointment.status == 'scheduled'
    
    async def test_create_appointment_slot_taken(self, db_session):
        # Test conflict detection
        pass
```

**Estimated Effort**: 2 weeks

---

### 8. **Missing Database Migration Strategy**
**Status**: ⚠️ No rollback procedures documented  
**Impact**: Risky deployments, potential data loss

**Issues**:
- No migration testing in CI/CD
- No rollback procedures documented
- Missing data migration scripts for schema changes

**Required Actions**:
1. Add migration tests to CI/CD pipeline
2. Document rollback procedures
3. Create data migration templates
4. Implement migration verification scripts

**Estimated Effort**: 2-3 days

---

## 🟡 High Priority Improvements (Priority 2)

### 9. **Performance Optimization**

**Issues**:
- N+1 query problems in list endpoints
- Missing database connection pooling configuration
- No query result caching
- No pagination on all list endpoints

**Actions**:
```python
# Use eager loading
from sqlalchemy.orm import selectinload

@router.get("/appointments/")
async def list_appointments(db: Session = Depends(get_db)):
    appointments = db.query(Appointment)\
        .options(selectinload(Appointment.patient))\
        .options(selectinload(Appointment.doctor))\
        .all()
    return appointments

# Add caching
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache

@router.get("/doctors/")
@cache(expire=300)  # Cache for 5 minutes
async def list_doctors(db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == 'doctor').all()
```

**Estimated Effort**: 3-4 days

---

### 10. **API Documentation Improvements**

**Issues**:
- Missing request/response examples in OpenAPI spec
- No error response documentation
- Missing authentication documentation

**Actions**:
1. Add comprehensive examples to all endpoints
2. Document all error responses
3. Add authentication flow diagrams
4. Create API changelog

**Estimated Effort**: 2-3 days

---

### 11. **Background Task Monitoring**

**Issues**:
- No visibility into Celery task status
- No task retry configuration
- No dead letter queue

**Actions**:
1. Add Celery Flower for monitoring
2. Configure task retry policies
3. Implement dead letter queue
4. Add task result backend

**Estimated Effort**: 2-3 days

---

### 12. **Database Backup and Recovery**

**Issues**:
- No automated backup procedures
- No point-in-time recovery capability
- Missing backup verification

**Actions**:
1. Implement automated daily backups
2. Configure WAL archiving for PITR
3. Add backup verification scripts
4. Document recovery procedures

**Estimated Effort**: 2-3 days

---

### 13. **Health Check Improvements**

**Current**: Basic `/health` endpoint  
**Needed**: Comprehensive health checks

**Actions**:
```python
# backend/app/api/v1/endpoints/health.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("/health/liveness")
async def liveness():
    """Kubernetes liveness probe"""
    return {"status": "alive"}

@router.get("/health/readiness")
async def readiness(db: Session = Depends(get_db)):
    """Kubernetes readiness probe"""
    try:
        # Check database
        db.execute("SELECT 1")
        
        # Check Redis
        redis.ping()
        
        return {"status": "ready", "checks": {
            "database": "ok",
            "redis": "ok"
        }}
    except Exception as e:
        return {"status": "not ready", "error": str(e)}
```

**Estimated Effort**: 1 day

---

### 14. **Audit Logging Enhancement**

**Current**: Basic audit service with TODOs  
**Needed**: Complete audit trail

**Actions**:
1. Implement database audit log storage
2. Add file-based audit logging
3. Track all data modifications
4. Add audit log query API

**Estimated Effort**: 2-3 days

---

### 15. **API Rate Limiting**

**Current**: None  
**Needed**: Per-user and per-endpoint rate limiting

**Actions**:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.state.limiter = limiter
@app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@router.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request):
    pass
```

**Estimated Effort**: 1-2 days

---

### 16. **WebSocket Implementation**

**Current**: Not implemented  
**Needed**: Real-time notifications and chat

**Actions**:
1. Implement WebSocket endpoint
2. Add connection management
3. Implement room-based messaging
4. Add presence tracking

**Estimated Effort**: 4-5 days

---

### 17. **File Upload Improvements**

**Current**: Basic implementation  
**Needed**: Robust file handling

**Issues**:
- No virus scanning
- Missing file size limits
- No thumbnail generation
- Missing CDN integration

**Actions**:
1. Add ClamAV integration for virus scanning
2. Implement file size and type validation
3. Add thumbnail generation for images
4. Integrate with CDN (CloudFront, Cloudflare)

**Estimated Effort**: 3-4 days

---

### 18. **Internationalization (i18n)**

**Current**: English only  
**Needed**: Multi-language support

**Actions**:
1. Implement gettext for backend messages
2. Add language detection from Accept-Language header
3. Translate error messages
4. Create translation workflow

**Estimated Effort**: 3-4 days

---

### 19. **GDPR Compliance**

**Current**: Basic privacy features  
**Needed**: Full GDPR compliance

**Actions**:
1. Implement data export API (right to data portability)
2. Add data deletion API (right to be forgotten)
3. Create consent management system
4. Add data processing audit trail
5. Implement anonymization for analytics

**Estimated Effort**: 1 week

---

### 20. **Appointment Slot Algorithm Optimization**

**Current**: Basic availability check  
**Needed**: Smart slot allocation

**Issues**:
- No buffer time between appointments
- No consideration for appointment type duration
- Missing break time support
- No over-booking prevention

**Actions**:
1. Implement configurable slot duration per appointment type
2. Add buffer time support
3. Support break times and lunch hours
4. Add over-booking prevention logic

**Estimated Effort**: 3-4 days

---

### 21. **Payment Processing**

**Current**: Stub implementation  
**Needed**: Full payment integration

**Actions**:
1. Integrate Stripe for payment processing
2. Implement webhook handling for payment events
3. Add refund functionality
4. Support multiple payment methods
5. Implement payment retry logic

**Estimated Effort**: 1 week

---

### 22. **Medical Data Validation**

**Current**: Basic validation  
**Needed**: Medical-specific validation

**Actions**:
1. Validate medication names against drug database
2. Check for drug interactions
3. Validate medical terminology
4. Add dosage format validation

**Estimated Effort**: 3-4 days

---

### 23. **Search Functionality**

**Current**: Basic database queries  
**Needed**: Full-text search

**Actions**:
1. Integrate Elasticsearch for full-text search
2. Implement doctor search with filters
3. Add medical record search
4. Support fuzzy matching and typo tolerance

**Estimated Effort**: 4-5 days

---

## 🟢 Medium Priority Enhancements (Priority 3)

### 24. **API Response Compression**
Add gzip compression for large responses

### 25. **Request Validation Middleware**
Comprehensive input validation and sanitization

### 26. **Database Query Optimization**
Query profiling and optimization

### 27. **Metrics and Monitoring**
Enhanced Prometheus metrics

### 28. **Code Quality Tools**
- Add pre-commit hooks
- Enforce code coverage thresholds
- Add security scanning (Bandit)

### 29. **Documentation Site**
Create comprehensive API documentation site with Docusaurus

### 30. **Environment-Specific Configs**
Better configuration management for dev/staging/prod

### 31. **Database Sharding Strategy**
Plan for horizontal scaling

### 32. **Microservices Architecture**
Split monolith into microservices (long-term)

### 33. **Event Sourcing**
Implement event sourcing for audit trail

### 34. **GraphQL API**
Add GraphQL endpoint alongside REST

### 35. **API Gateway**
Implement API gateway for routing and auth

---

## 🚀 Possible Feature Additions

### 36. **AI-Powered Features**

**Symptom Checker**:
- Integrate with medical knowledge base
- Provide preliminary diagnosis suggestions
- Recommend specialists

**Medical Chatbot**:
- Answer common medical questions
- Help patients prepare for appointments
- Provide medication information

**Predictive Analytics**:
- Predict no-show probability
- Optimize appointment scheduling
- Forecast capacity needs

**Estimated Effort**: 2-3 months

---

### 37. **Telemedicine Video Integration**

**Features**:
- WebRTC video conferencing
- Screen sharing for medical images
- Recording capability (with consent)
- Virtual waiting room
- Chat during consultation

**Technology**: Twilio Video, Agora, or Jitsi

**Estimated Effort**: 3-4 weeks

---

### 38. **Electronic Health Records (EHR) Integration**

**Features**:
- HL7 FHIR API support
- Integration with external EHR systems
- Data import/export
- Standardized medical coding (ICD-10, CPT)

**Estimated Effort**: 2-3 months

---

### 39. **Prescription Management**

**Features**:
- Electronic prescribing (e-prescribe)
- Integration with pharmacy systems
- Medication adherence tracking
- Refill requests and approvals
- Drug interaction checking

**Estimated Effort**: 4-6 weeks

---

### 40. **Insurance Verification**

**Features**:
- Real-time insurance eligibility checks
- Claims submission
- EOB processing
- Prior authorization management

**Estimated Effort**: 2-3 months

---

### 41. **Patient Portal Enhancements**

**Features**:
- Lab results viewing
- Radiology image viewing (DICOM support)
- Immunization records
- Growth charts for pediatric patients
- Family health history

**Estimated Effort**: 6-8 weeks

---

### 42. **Doctor Availability Prediction**

**Features**:
- ML model to predict doctor availability
- Suggest optimal appointment times
- Reduce no-shows through smart scheduling

**Estimated Effort**: 4-6 weeks

---

### 43. **Multi-Facility Support**

**Features**:
- Support for healthcare networks
- Cross-facility appointment booking
- Shared patient records
- Facility-specific configurations

**Estimated Effort**: 4-6 weeks

---

### 44. **Clinical Decision Support**

**Features**:
- Treatment guideline recommendations
- Drug dosage calculators
- Medical calculators (BMI, GFR, etc.)
- Clinical pathway support

**Estimated Effort**: 2-3 months

---

### 45. **Waiting List Management**

**Current**: Basic implementation  
**Enhancements**:
- Priority-based waiting list
- Automatic matching when slots open
- SMS notifications for available slots
- Configurable matching rules

**Estimated Effort**: 2-3 weeks

---

### 46. **Review and Rating System Enhancements**

**Current**: Basic reviews  
**Additions**:
- Verified patient reviews only
- Sentiment analysis
- Review moderation
- Doctor response capability
- Review helpfulness voting

**Estimated Effort**: 2-3 weeks

---

### 47. **Appointment Reminders Enhancement**

**Current**: Basic reminder task  
**Additions**:
- Multi-channel reminders (email, SMS, push, WhatsApp)
- Customizable reminder timing
- Reminder preferences per user
- Two-way SMS for confirmation/cancellation
- Automated follow-up reminders

**Estimated Effort**: 2-3 weeks

---

### 48. **Analytics Dashboard API**

**Features**:
- Appointment statistics
- Revenue analytics
- Patient demographics
- No-show patterns
- Peak hours analysis
- Doctor performance metrics

**Estimated Effort**: 3-4 weeks

---

### 49. **Referral Management**

**Features**:
- Create referrals to specialists
- Track referral status
- Share medical records with referred doctors
- Referral analytics

**Estimated Effort**: 3-4 weeks

---

### 50. **Vaccination Management**

**Current**: Basic model  
**Enhancements**:
- Vaccination schedule tracking
- Automated reminders for due vaccinations
- Vaccination certificate generation
- Integration with national immunization registries

**Estimated Effort**: 2-3 weeks

---

### 51. **Chronic Disease Management**

**Features**:
- Care plan management
- Medication adherence tracking
- Symptom tracking
- Automated check-ins
- Care team coordination

**Estimated Effort**: 2-3 months

---

### 52. **Billing and Invoicing**

**Features**:
- Automated invoice generation
- Payment plan support
- Insurance claim filing
- Financial reporting
- Payment receipt generation

**Estimated Effort**: 4-6 weeks

---

### 53. **Mobile App Backend**

**Features**:
- Mobile-specific endpoints
- Push notification service
- Offline data sync support
- Mobile app analytics

**Estimated Effort**: 3-4 weeks

---

### 54. **Third-Party Integrations**

**Possible Integrations**:
- Calendar sync (Google Calendar, Outlook)
- SMS providers (Twilio, Vonage)
- Email providers (SendGrid, Mailgun)
- Payment gateways (Stripe, PayPal, Square)
- Identity providers (Auth0, Okta)
- Health wearables (Fitbit, Apple Health)

**Estimated Effort**: 1-2 weeks per integration

---

### 55. **Admin Features Enhancement**

**Features**:
- User impersonation (for support)
- Bulk operations
- Advanced filtering and search
- Custom report builder
- System configuration UI
- Feature flags management

**Estimated Effort**: 4-6 weeks

---

## 📊 Implementation Roadmap

### Phase 1: Critical Fixes (Sprint 1-2, 4 weeks)
- [ ] Fix API consistency issues (#1)
- [ ] Implement proper error handling and logging (#2)
- [ ] Address security vulnerabilities (#3)
- [ ] Add database indexes (#4)

### Phase 2: Essential Features (Sprint 3-5, 6 weeks)
- [ ] Complete email/SMS integration (#5)
- [ ] Improve test coverage (#7)
- [ ] Implement WebSocket for real-time features (#16)
- [ ] Performance optimization (#9)

### Phase 3: High-Value Features (Sprint 6-10, 10 weeks)
- [ ] Telemedicine video integration (#37)
- [ ] Prescription management (#39)
- [ ] Payment processing (#21)
- [ ] Search functionality (#23)

### Phase 4: Advanced Features (Sprint 11+, ongoing)
- [ ] AI-powered features (#36)
- [ ] EHR integration (#38)
- [ ] Clinical decision support (#44)
- [ ] Chronic disease management (#51)

---

## 🔍 Success Metrics

### Code Quality
- Test coverage: 30% → 80%+
- Code complexity: Reduce cyclomatic complexity to <10
- Security vulnerabilities: 0 high/critical issues

### Performance
- API response time: <200ms (p95)
- Database query time: <50ms (p95)
- Throughput: 1000+ req/s

### Reliability
- Uptime: 99.9%+
- Error rate: <0.1%
- Mean Time To Recovery: <15 minutes

---

## 📝 Notes

- All improvements should maintain backward compatibility when possible
- Security and data privacy should be prioritized in all changes
- Each feature should include comprehensive tests
- Documentation should be updated alongside code changes
- Performance impact should be measured for all changes

---

**Last Updated**: October 31, 2025  
**Version**: 1.0.0
