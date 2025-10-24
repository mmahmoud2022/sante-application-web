"""
Test new schemas to ensure validation works correctly
"""
import pytest
from datetime import datetime, time
from decimal import Decimal
from pydantic import ValidationError

from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate, PrescriptionResponse
from app.schemas.vaccination import VaccinationRecordCreate, VaccinationRecordUpdate
from app.schemas.notification import NotificationCreate, NotificationUpdate
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentRefund
from app.schemas.review import ReviewCreate, ReviewUpdate, DoctorResponse
from app.schemas.schedule import DoctorScheduleCreate, DoctorScheduleUpdate
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.schemas.health_device import HealthDeviceDataCreate, HealthDeviceDataUpdate
from app.schemas.appointment import AppointmentCreate, AppointmentResponse

from app.models.prescription import PrescriptionStatus
from app.models.notification import NotificationType, NotificationChannel
from app.models.payment import PaymentMethod, PaymentStatus
from app.models.schedule import DayOfWeek, ScheduleType
from app.models.document import DocumentType
from app.models.health_device import DeviceType, MeasurementType
from app.models.appointment import AppointmentStatus, AppointmentType


class TestPrescriptionSchemas:
    """Test Prescription schemas"""
    
    def test_prescription_create_valid(self):
        """Test valid prescription creation schema"""
        data = {
            "patient_id": 1,
            "medication_name": "Aspirin",
            "dosage": "100mg",
            "frequency": "Once daily",
            "duration_days": 30,
        }
        schema = PrescriptionCreate(**data)
        
        assert schema.medication_name == "Aspirin"
        assert schema.duration_days == 30
        assert schema.refills_allowed == 0
    
    def test_prescription_create_invalid_duration(self):
        """Test prescription creation with invalid duration"""
        data = {
            "patient_id": 1,
            "medication_name": "Aspirin",
            "dosage": "100mg",
            "frequency": "Once daily",
            "duration_days": 0,  # Invalid
        }
        
        with pytest.raises(ValidationError):
            PrescriptionCreate(**data)


class TestNotificationSchemas:
    """Test Notification schemas"""
    
    def test_notification_create_valid(self):
        """Test valid notification creation schema"""
        data = {
            "user_id": 1,
            "notification_type": NotificationType.APPOINTMENT_REMINDER,
            "channel": NotificationChannel.EMAIL,
            "title": "Reminder",
            "message": "You have an appointment tomorrow"
        }
        schema = NotificationCreate(**data)
        
        assert schema.notification_type == NotificationType.APPOINTMENT_REMINDER
        assert schema.channel == NotificationChannel.EMAIL


class TestPaymentSchemas:
    """Test Payment schemas"""
    
    def test_payment_create_valid(self):
        """Test valid payment creation schema"""
        data = {
            "patient_id": 1,
            "doctor_id": 2,
            "amount": Decimal("50.00"),
            "payment_method": PaymentMethod.CREDIT_CARD
        }
        schema = PaymentCreate(**data)
        
        assert schema.amount == Decimal("50.00")
        assert schema.currency == "EUR"
        assert schema.payment_method == PaymentMethod.CREDIT_CARD
    
    def test_payment_create_invalid_amount(self):
        """Test payment creation with invalid amount"""
        data = {
            "patient_id": 1,
            "doctor_id": 2,
            "amount": Decimal("-10.00"),  # Negative amount
            "payment_method": PaymentMethod.CREDIT_CARD
        }
        
        with pytest.raises(ValidationError):
            PaymentCreate(**data)
    
    def test_payment_refund_valid(self):
        """Test valid payment refund schema"""
        data = {
            "refunded_amount": Decimal("20.00"),
            "refund_reason": "Cancelled appointment"
        }
        schema = PaymentRefund(**data)
        
        assert schema.refunded_amount == Decimal("20.00")
        assert schema.refund_reason == "Cancelled appointment"


class TestReviewSchemas:
    """Test Review schemas"""
    
    def test_review_create_valid(self):
        """Test valid review creation schema"""
        data = {
            "doctor_id": 1,
            "rating": 4.5,
            "title": "Great Doctor",
            "review_text": "Very professional"
        }
        schema = ReviewCreate(**data)
        
        assert schema.rating == 4.5
        assert schema.doctor_id == 1
    
    def test_review_create_invalid_rating(self):
        """Test review creation with invalid rating"""
        data = {
            "doctor_id": 1,
            "rating": 6.0,  # Rating too high
            "title": "Great Doctor"
        }
        
        with pytest.raises(ValidationError):
            ReviewCreate(**data)
    
    def test_doctor_response_valid(self):
        """Test valid doctor response schema"""
        data = {
            "doctor_response": "Thank you for your feedback!"
        }
        schema = DoctorResponse(**data)
        
        assert schema.doctor_response == "Thank you for your feedback!"


class TestDoctorScheduleSchemas:
    """Test DoctorSchedule schemas"""
    
    def test_schedule_create_valid(self):
        """Test valid schedule creation schema"""
        data = {
            "schedule_type": ScheduleType.REGULAR,
            "day_of_week": DayOfWeek.MONDAY,
            "start_time": time(9, 0),
            "end_time": time(17, 0),
        }
        schema = DoctorScheduleCreate(**data)
        
        assert schema.schedule_type == ScheduleType.REGULAR
        assert schema.day_of_week == DayOfWeek.MONDAY
        assert schema.slot_duration_minutes == 30


class TestDocumentSchemas:
    """Test Document schemas"""
    
    def test_document_create_valid(self):
        """Test valid document creation schema"""
        data = {
            "patient_id": 1,
            "document_type": DocumentType.LAB_RESULT,
            "title": "Blood Test",
            "file_name": "blood_test.pdf",
            "file_path": "/documents/blood_test.pdf"
        }
        schema = DocumentCreate(**data)
        
        assert schema.document_type == DocumentType.LAB_RESULT
        assert schema.title == "Blood Test"


class TestHealthDeviceDataSchemas:
    """Test HealthDeviceData schemas"""
    
    def test_health_device_data_create_valid(self):
        """Test valid health device data creation schema"""
        data = {
            "patient_id": 1,
            "device_type": DeviceType.FITNESS_TRACKER,
            "measurement_type": MeasurementType.HEART_RATE,
            "measurement_date": datetime.now(),
            "value": 72.0,
            "value_unit": "bpm"
        }
        schema = HealthDeviceDataCreate(**data)
        
        assert schema.device_type == DeviceType.FITNESS_TRACKER
        assert schema.measurement_type == MeasurementType.HEART_RATE
        assert schema.value == 72.0


class TestAppointmentSchemas:
    """Test appointment schemas"""

    def test_appointment_create_normalizes_input(self):
        """Ensure front-end payloads map to backend enums."""

        payload = {
            "doctor_id": 9,
            "appointment_date": datetime(2024, 6, 1),
            "appointment_time": "09:30",
            "appointment_type": "video",
            "chief_complaint": "General consultation",
            "notes": "Prefer virtual visit",
        }

        schema = AppointmentCreate(**payload)

        assert schema.appointment_type == AppointmentType.VIDEO_CALL
        assert schema.chief_complaint == "General consultation"
        assert schema.notes == "Prefer virtual visit"

    def test_appointment_create_invalid_time(self):
        """Invalid time formats should raise validation errors."""

        payload = {
            "doctor_id": 1,
            "appointment_date": datetime(2024, 6, 1),
            "appointment_time": "9h30",
        }

        with pytest.raises(ValidationError):
            AppointmentCreate(**payload)

    def test_appointment_response_serialization_aliases(self):
        """Ensure response schema exposes UI-friendly aliases."""

        schema = AppointmentResponse.model_validate(
            {
                "id": 1,
                "patient_id": 2,
                "doctor_id": 3,
                "appointment_date": datetime(2024, 6, 1, 15, 45),
                "duration_minutes": 30,
                "appointment_type": AppointmentType.PHONE_CALL,
                "status": AppointmentStatus.PENDING,
                "reason": "At-home follow-up",
                "notes": None,
                "diagnosis": None,
                "prescription": None,
                "video_call_link": None,
                "video_call_room_id": None,
                "reminder_sent": False,
                "reminder_sent_at": None,
                "cancelled_by": None,
                "cancellation_reason": None,
                "cancelled_at": None,
                "created_at": datetime(2024, 5, 1, 12, 0),
                "updated_at": None,
            }
        )

        assert schema.appointment_time == "15:45"
        assert schema.chief_complaint == "At-home follow-up"

        serialized = schema.model_dump(mode="json")
        assert serialized["appointment_type"] == "home_visit"


class TestVaccinationSchemas:
    """Test Vaccination schemas"""
    
    def test_vaccination_create_valid(self):
        """Test valid vaccination creation schema"""
        data = {
            "patient_id": 1,
            "vaccine_name": "COVID-19",
            "administration_date": datetime.now(),
        }
        schema = VaccinationRecordCreate(**data)
        
        assert schema.vaccine_name == "COVID-19"
        assert schema.patient_id == 1
