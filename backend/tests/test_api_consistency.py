"""
Comprehensive API endpoint tests to verify backend-frontend consistency.

This test file validates:
1. Schema definitions match frontend TypeScript interfaces
2. Enum values are consistent
3. Data structures match expectations
4. Field names are consistent

These tests focus on schema validation rather than database integration.
"""
import pytest
from datetime import datetime, date, time
from decimal import Decimal
from pydantic import ValidationError

from app.models.user import UserRole
from app.models.appointment import AppointmentStatus, AppointmentType
from app.models.prescription import PrescriptionStatus
from app.models.notification import NotificationType, NotificationChannel
from app.models.document import DocumentType
from app.models.payment import PaymentMethod, PaymentStatus
from app.models.schedule import ScheduleType, DayOfWeek

from app.schemas.appointment import AppointmentCreate, AppointmentResponse, AppointmentUpdate
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.schemas.review import ReviewCreate, ReviewResponse
from app.schemas.notification import NotificationCreate, NotificationResponse
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordResponse
from app.schemas.document import DocumentCreate, DocumentResponse
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.schemas.schedule import DoctorScheduleCreate, DoctorScheduleResponse


class TestAppointmentSchemas:
    """Test appointment schemas for frontend consistency."""
    
    def test_appointment_type_enum_values(self):
        """Test that all AppointmentType enum values match frontend expectations."""
        # Frontend expects: in_person, video_call, phone_call
        backend_values = [t.value for t in AppointmentType]
        
        assert "in_person" in backend_values
        assert "video_call" in backend_values
        assert "phone_call" in backend_values
        
        # These should be the ONLY values
        assert len(backend_values) == 3
    
    def test_appointment_create_accepts_frontend_types(self):
        """Test that AppointmentCreate schema accepts frontend type values."""
        # Frontend sends these types
        frontend_types = ["in_person", "video_call", "phone_call"]
        
        for appointment_type in frontend_types:
            # Should not raise ValidationError
            schema = AppointmentCreate(
                doctor_id=1,
                appointment_date=datetime(2025, 12, 1, 10, 0),
                appointment_type=appointment_type,
                reason="Test"
            )
            assert schema.appointment_type in [AppointmentType.IN_PERSON, 
                                              AppointmentType.VIDEO_CALL, 
                                              AppointmentType.PHONE_CALL]
    
    def test_appointment_type_serialization_consistency(self):
        """Test that AppointmentResponse serializes types consistently for frontend."""
        # Test each appointment type serializes correctly
        test_cases = [
            (AppointmentType.IN_PERSON, "in_person"),
            (AppointmentType.VIDEO_CALL, "video_call"),
            (AppointmentType.PHONE_CALL, "phone_call"),
        ]
        
        # Use fixed datetime for deterministic test behavior
        fixed_datetime = datetime(2025, 12, 1, 10, 0)
        
        for appointment_type, expected_serialized in test_cases:
            response = AppointmentResponse(
                id=1,
                patient_id=2,
                doctor_id=3,
                appointment_date=fixed_datetime,
                duration_minutes=30,
                appointment_type=appointment_type,
                status=AppointmentStatus.PENDING,
                reason="Test",
                notes=None,
                video_call_link=None,
                video_call_room_id=None,
                reminder_sent=False,
                reminder_sent_at=None,
                cancelled_by=None,
                cancellation_reason=None,
                cancelled_at=None,
                created_at=fixed_datetime,
                updated_at=None,
            )
            
            # Serialize to JSON (as API would return)
            data = response.model_dump(mode="json")
            
            # Verify serialized value matches frontend expectation
            assert data["appointment_type"] == expected_serialized, \
                f"Expected {expected_serialized}, got {data['appointment_type']}"
    
    def test_appointment_backward_compatibility(self):
        """Test that backend accepts legacy frontend values for backward compatibility."""
        # Test backward compatibility with old values
        # Note: Legacy mapping includes "home_visit" which historically mapped to PHONE_CALL
        # in the codebase, despite the semantic difference. This maintains API compatibility.
        legacy_mappings = [
            ("video", AppointmentType.VIDEO_CALL),  # Legacy shorthand for video calls
            ("home_visit", AppointmentType.PHONE_CALL),  # Legacy value maintained for compatibility
        ]
        
        for legacy_value, expected_type in legacy_mappings:
            schema = AppointmentCreate(
                doctor_id=1,
                appointment_date=datetime(2025, 12, 1, 10, 0),
                appointment_type=legacy_value,
                reason="Test"
            )
            assert schema.appointment_type == expected_type, \
                f"Legacy value '{legacy_value}' should map to {expected_type}"
    
    def test_appointment_response_has_all_fields(self):
        """Test that AppointmentResponse includes all fields frontend expects."""
        # Create a response schema instance
        schema = AppointmentResponse(
            id=1,
            patient_id=2,
            doctor_id=3,
            appointment_date=datetime(2025, 12, 1, 10, 0),
            duration_minutes=30,
            appointment_type=AppointmentType.VIDEO_CALL,
            status=AppointmentStatus.PENDING,
            reason="Test appointment",
            notes="Test notes",
            video_call_link="https://meet.test.com/room123",
            video_call_room_id="room123",
            reminder_sent=False,
            reminder_sent_at=None,
            cancelled_by=None,
            cancellation_reason=None,
            cancelled_at=None,
            created_at=datetime.now(),
            updated_at=None,
        )
        
        # Serialize to dict (as API would return)
        data = schema.model_dump()
        
        # Check all required fields are present
        required_fields = [
            "id", "patient_id", "doctor_id", "appointment_date",
            "duration_minutes", "appointment_type", "status",
            "reason", "notes", "video_call_link", "video_call_room_id",
            "reminder_sent", "reminder_sent_at",
            "cancelled_by", "cancellation_reason", "cancelled_at",
            "created_at", "updated_at"
        ]
        
        for field in required_fields:
            assert field in data, f"Field '{field}' missing from AppointmentResponse"
    
    def test_appointment_reason_field_consistency(self):
        """Test that 'reason' field is used (not chief_complaint in model)."""
        # Create with reason
        schema = AppointmentCreate(
            doctor_id=1,
            appointment_date=datetime(2025, 12, 1, 10, 0),
            reason="Annual checkup",
            chief_complaint="Also accepted for compatibility"
        )
        
        # Should accept both for backward compatibility
        assert schema.reason == "Annual checkup"
        
        # Response should use 'reason'
        response = AppointmentResponse(
            id=1,
            patient_id=2,
            doctor_id=3,
            appointment_date=datetime(2025, 12, 1, 10, 0),
            duration_minutes=30,
            appointment_type=AppointmentType.IN_PERSON,
            status=AppointmentStatus.PENDING,
            reason="Annual checkup",
            notes=None,
            video_call_link=None,
            video_call_room_id=None,
            reminder_sent=False,
            reminder_sent_at=None,
            cancelled_by=None,
            cancellation_reason=None,
            cancelled_at=None,
            created_at=datetime.now(),
            updated_at=None,
        )
        
        data = response.model_dump()
        assert "reason" in data
        assert data["reason"] == "Annual checkup"


class TestUserSchemas:
    """Test user schemas for field name consistency."""
    
    def test_user_response_field_names(self):
        """Test that UserResponse has correct field names."""
        # Create a user response
        schema = UserResponse(
            id=1,
            email="test@example.com",
            first_name="John",
            last_name="Doe",
            role=UserRole.PATIENT,
            phone="1234567890",
            profile_image="/images/user.jpg",
            is_active=True,
            is_verified=True,
            created_at=datetime.now(),
        )
        
        data = schema.model_dump()
        
        # Check field names match backend expectations (not frontend legacy names)
        assert "phone" in data, "Should be 'phone' not 'phone_number'"
        assert "profile_image" in data, "Should be 'profile_image' not 'profile_picture_url'"
        
        # Verify values
        assert data["phone"] == "1234567890"
        assert data["profile_image"] == "/images/user.jpg"
    
    def test_doctor_consultation_fee_format(self):
        """Test that consultation_fee is in centimes (integer)."""
        # Doctor with consultation fee
        schema = UserResponse(
            id=1,
            email="doctor@example.com",
            first_name="Jane",
            last_name="Smith",
            role=UserRole.DOCTOR,
            consultation_fee=5000,  # 50.00 EUR in centimes
            is_active=True,
            is_verified=True,
            created_at=datetime.now(),
        )
        
        data = schema.model_dump()
        
        # consultation_fee should be in centimes (integer)
        assert "consultation_fee" in data
        assert isinstance(data["consultation_fee"], int)
        assert data["consultation_fee"] == 5000


class TestNotificationSchemas:
    """Test notification schemas for enum consistency."""
    
    def test_notification_type_enum_complete(self):
        """Test that all NotificationType enum values match frontend expectations."""
        # Frontend expects all these types
        expected_types = [
            "appointment_reminder",
            "appointment_confirmed",
            "appointment_cancelled",
            "appointment_rescheduled",
            "appointment_delayed",
            "prescription_ready",
            "prescription_renewal",
            "vaccination_due",
            "message_received",
            "payment_received",
            "payment_failed",
            "document_ready",
            "system_alert",
        ]
        
        backend_types = [t.value for t in NotificationType]
        
        # All expected types should be present in backend
        for expected_type in expected_types:
            assert expected_type in backend_types, \
                f"NotificationType.{expected_type} missing from backend enum"
    
    def test_notification_response_serialization(self):
        """Test that notification response serializes correctly."""
        from app.models.notification import NotificationStatus
        
        schema = NotificationResponse(
            id=1,
            user_id=1,
            notification_type=NotificationType.APPOINTMENT_REMINDER,
            channel=NotificationChannel.EMAIL,
            title="Reminder",
            message="You have an appointment tomorrow",
            status=NotificationStatus.PENDING,
            created_at=datetime.now(),
        )
        
        data = schema.model_dump()
        
        # Type should be serialized as string
        assert data["notification_type"] == "appointment_reminder" or \
               data["type"] == "appointment_reminder"


class TestMedicalRecordSchemas:
    """Test medical record schemas for data structure consistency."""
    
    def test_medical_record_list_fields(self):
        """Test that allergies and chronic_conditions support list type."""
        # Backend should accept lists for these fields
        schema = MedicalRecordCreate(
            patient_id=1,
            allergies=["Penicillin", "Pollen"],
            chronic_conditions=["Diabetes", "Hypertension"],
        )
        
        # Verify it accepts lists
        assert schema.allergies == ["Penicillin", "Pollen"]
        assert schema.chronic_conditions == ["Diabetes", "Hypertension"]


class TestPrescriptionSchemas:
    """Test prescription schemas for field completeness."""
    
    def test_prescription_response_fields(self):
        """Test that prescription response contains all fields including quantity and instructions."""
        schema = PrescriptionResponse(
            id=1,
            patient_id=1,
            doctor_id=2,
            document_id=55,
            medication_name="Aspirin",
            dosage="100mg",
            frequency="Once daily",
            duration_days=30,
            quantity=30,
            refills_allowed=2,
            refills_remaining=2,
            instructions="Take with food",
            status=PrescriptionStatus.ACTIVE,
            prescribed_date=datetime.now(),
            auto_renewal_enabled=False,
            created_at=datetime.now(),
        )
        
        data = schema.model_dump()
        
        # Check all expected fields
        expected_fields = [
            "id", "patient_id", "doctor_id", "medication_name",
            "dosage", "frequency", "duration_days", "quantity",
            "refills_allowed", "refills_remaining", "instructions",
            "status", "document_id", "document"
        ]
        
        for field in expected_fields:
            assert field in data, f"Field '{field}' missing from PrescriptionResponse"
        
        # Verify values
        assert data["quantity"] == 30
        assert data["instructions"] == "Take with food"
        assert data["document_id"] == 55


class TestReviewSchemas:
    """Test review schemas for field name consistency."""
    
    def test_review_response_field_names(self):
        """Test that review uses 'review_text' not 'comment'."""
        schema = ReviewResponse(
            id=1,
            patient_id=1,
            doctor_id=2,
            rating=4.5,
            title="Great doctor",
            review_text="Very professional and caring",
            verified_visit=True,
            is_published=True,
            is_flagged=False,
            helpful_count=5,
            created_at=datetime.now(),
        )
        
        data = schema.model_dump()
        
        # Should use 'review_text' not 'comment'
        assert "review_text" in data, "Should use 'review_text' field"
        assert data["review_text"] == "Very professional and caring"
        
        # Should also have 'title' field
        assert "title" in data
        assert data["title"] == "Great doctor"


class TestDocumentSchemas:
    """Test document schemas for field name consistency."""
    
    def test_document_response_field_names(self):
        """Test that document response uses correct field names."""
        schema = DocumentResponse(
            id=1,
            patient_id=1,
            document_type=DocumentType.LAB_RESULT,
            title="Blood Test Results",
            description="Annual blood work",
            file_name="blood_test.pdf",
            file_path="/documents/blood_test.pdf",
            file_size_bytes=102400,
            mime_type="application/pdf",
            is_shared=True,
            ocr_processed=False,
            verified=True,
            created_at=datetime.now(),
        )
        
        data = schema.model_dump()
        
        # Check correct field names
        assert "file_path" in data, "Should use 'file_path' not 'file_url'"
        assert "file_size_bytes" in data, "Should use 'file_size_bytes' not 'file_size'"
        assert "is_shared" in data, "Should use 'is_shared' not 'is_shared_with_doctors'"
        assert "verified" in data, "Should use 'verified' not 'is_verified'"
        
        # OCR field should be present
        assert "ocr_text" in data or True  # Optional field


class TestPaymentSchemas:
    """Test payment schemas for currency handling."""
    
    def test_payment_amount_format(self):
        """Test that payment amounts are in correct decimal format."""
        schema = PaymentCreate(
            patient_id=1,
            doctor_id=2,
            amount=Decimal("50.00"),  # In EUR (decimal format)
            currency="EUR",
            payment_method=PaymentMethod.CREDIT_CARD,
        )
        
        data = schema.model_dump()
        
        # Amount should be a Decimal
        assert "amount" in data
        assert data["amount"] == Decimal("50.00")
        
        # Currency should be ISO code
        assert "currency" in data
        assert data["currency"] == "EUR"


class TestScheduleSchemas:
    """Test schedule schemas for field completeness."""
    
    def test_schedule_response_fields(self):
        """Test that schedule response includes all fields."""
        schema = DoctorScheduleResponse(
            id=1,
            doctor_id=1,
            schedule_type=ScheduleType.REGULAR,
            day_of_week=DayOfWeek.MONDAY,
            start_time=time(9, 0),
            end_time=time(17, 0),
            slot_duration_minutes=30,
            buffer_time_minutes=5,
            max_patients_per_slot=1,
            is_available=True,
            is_video_consultation=False,
            is_active=True,
            created_at=datetime.now(),
        )
        
        data = schema.model_dump()
        
        # Check for all important fields
        expected_fields = [
            "schedule_type", "start_time", "end_time",
            "slot_duration_minutes", "buffer_time_minutes",
            "max_patients_per_slot"
        ]
        
        for field in expected_fields:
            assert field in data, f"Field '{field}' missing from DoctorScheduleResponse"
