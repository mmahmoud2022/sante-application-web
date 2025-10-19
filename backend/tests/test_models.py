"""
Test new models to ensure they can be instantiated correctly
"""
import pytest
from datetime import datetime, time
from decimal import Decimal

from app.models.prescription import Prescription, PrescriptionStatus
from app.models.vaccination import VaccinationRecord
from app.models.notification import Notification, NotificationType, NotificationChannel, NotificationStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.review import Review
from app.models.schedule import DoctorSchedule, DayOfWeek, ScheduleType
from app.models.document import Document, DocumentType
from app.models.health_device import HealthDeviceData, DeviceType, MeasurementType


class TestPrescriptionModel:
    """Test Prescription model"""
    
    def test_prescription_creation(self):
        """Test creating a prescription instance"""
        prescription = Prescription(
            patient_id=1,
            doctor_id=2,
            medication_name="Test Medication",
            dosage="100mg",
            frequency="Twice daily",
            duration_days=30,
            status=PrescriptionStatus.ACTIVE
        )
        
        assert prescription.medication_name == "Test Medication"
        assert prescription.dosage == "100mg"
        assert prescription.status == PrescriptionStatus.ACTIVE
        assert prescription.duration_days == 30
    
    def test_prescription_repr(self):
        """Test prescription string representation"""
        prescription = Prescription(
            id=1,
            patient_id=1,
            doctor_id=2,
            medication_name="Test Med",
            dosage="50mg",
            frequency="Daily",
            duration_days=7
        )
        
        assert "Test Med" in repr(prescription)


class TestVaccinationRecordModel:
    """Test VaccinationRecord model"""
    
    def test_vaccination_record_creation(self):
        """Test creating a vaccination record instance"""
        vaccination = VaccinationRecord(
            patient_id=1,
            vaccine_name="COVID-19",
            vaccine_type="mRNA",
            administration_date=datetime.now(),
            dose_number=1,
            total_doses=2,
            verified=False
        )
        
        assert vaccination.vaccine_name == "COVID-19"
        assert vaccination.vaccine_type == "mRNA"
        assert vaccination.dose_number == 1
        assert vaccination.verified is False


class TestNotificationModel:
    """Test Notification model"""
    
    def test_notification_creation(self):
        """Test creating a notification instance"""
        notification = Notification(
            user_id=1,
            notification_type=NotificationType.APPOINTMENT_REMINDER,
            channel=NotificationChannel.EMAIL,
            status=NotificationStatus.PENDING,
            title="Appointment Reminder",
            message="You have an appointment tomorrow",
            retry_count=0
        )
        
        assert notification.notification_type == NotificationType.APPOINTMENT_REMINDER
        assert notification.channel == NotificationChannel.EMAIL
        assert notification.status == NotificationStatus.PENDING
        assert notification.retry_count == 0


class TestPaymentModel:
    """Test Payment model"""
    
    def test_payment_creation(self):
        """Test creating a payment instance"""
        payment = Payment(
            patient_id=1,
            doctor_id=2,
            amount=Decimal("50.00"),
            currency="EUR",
            payment_method=PaymentMethod.CREDIT_CARD,
            status=PaymentStatus.PENDING,
            refunded_amount=Decimal("0.00")
        )
        
        assert payment.amount == Decimal("50.00")
        assert payment.currency == "EUR"
        assert payment.payment_method == PaymentMethod.CREDIT_CARD
        assert payment.refunded_amount == Decimal("0.00")


class TestReviewModel:
    """Test Review model"""
    
    def test_review_creation(self):
        """Test creating a review instance"""
        review = Review(
            patient_id=1,
            doctor_id=2,
            rating=4.5,
            title="Great Doctor",
            review_text="Very professional and caring",
            verified_visit=False,
            helpful_count=0
        )
        
        assert review.rating == 4.5
        assert review.title == "Great Doctor"
        assert review.verified_visit is False
        assert review.helpful_count == 0


class TestDoctorScheduleModel:
    """Test DoctorSchedule model"""
    
    def test_schedule_creation(self):
        """Test creating a doctor schedule instance"""
        schedule = DoctorSchedule(
            doctor_id=1,
            schedule_type=ScheduleType.REGULAR,
            day_of_week=DayOfWeek.MONDAY,
            start_time=time(9, 0),
            end_time=time(17, 0),
            slot_duration_minutes=30,
            is_available=True
        )
        
        assert schedule.day_of_week == DayOfWeek.MONDAY
        assert schedule.start_time == time(9, 0)
        assert schedule.end_time == time(17, 0)
        assert schedule.is_available is True


class TestDocumentModel:
    """Test Document model"""
    
    def test_document_creation(self):
        """Test creating a document instance"""
        document = Document(
            patient_id=1,
            document_type=DocumentType.LAB_RESULT,
            title="Blood Test Results",
            file_name="blood_test.pdf",
            file_path="/documents/blood_test.pdf",
            is_shared=False,
            verified=False
        )
        
        assert document.document_type == DocumentType.LAB_RESULT
        assert document.title == "Blood Test Results"
        assert document.is_shared is False
        assert document.verified is False


class TestHealthDeviceDataModel:
    """Test HealthDeviceData model"""
    
    def test_health_device_data_creation(self):
        """Test creating health device data instance"""
        device_data = HealthDeviceData(
            patient_id=1,
            device_type=DeviceType.FITNESS_TRACKER,
            measurement_type=MeasurementType.HEART_RATE,
            measurement_date=datetime.now(),
            value=72.0,
            value_unit="bpm"
        )
        
        assert device_data.device_type == DeviceType.FITNESS_TRACKER
        assert device_data.measurement_type == MeasurementType.HEART_RATE
        assert device_data.value == 72.0
        assert device_data.value_unit == "bpm"
