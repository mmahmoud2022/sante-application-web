"""
Tests for appointment service with booking validation
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.user import User, UserRole
from app.models.schedule import DoctorSchedule, ScheduleType, DayOfWeek
from app.schemas.appointment import AppointmentCreate
from app.services.appointment_service import (
    check_slot_availability,
    validate_booking_time,
    validate_appointment_type,
    can_cancel_appointment,
    create_appointment_with_validation,
    verify_teleconsultation_readiness,
)


def create_test_user(db: Session, role: UserRole = UserRole.PATIENT, email: str = "test@example.com") -> User:
    """Helper to create a test user"""
    user = User(
        email=email,
        hashed_password="hashed_password",
        first_name="Test",
        last_name="User",
        role=role,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_test_doctor(db: Session, email: str = "doctor@example.com") -> User:
    """Helper to create a test doctor"""
    doctor = User(
        email=email,
        hashed_password="hashed_password",
        first_name="Dr.",
        last_name="Smith",
        role=UserRole.DOCTOR,
        is_active=True,
        is_verified=True,
        specialization="General Practitioner",
        city="Paris",
        accepting_new_patients=True
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


def create_test_schedule(db: Session, doctor_id: int, is_video: bool = False) -> DoctorSchedule:
    """Helper to create a test schedule"""
    from datetime import time
    
    schedule = DoctorSchedule(
        doctor_id=doctor_id,
        schedule_type=ScheduleType.REGULAR,
        day_of_week=DayOfWeek.MONDAY,
        start_time=time(9, 0),
        end_time=time(17, 0),
        slot_duration_minutes=30,
        is_available=True,
        is_video_consultation=is_video,
        custom_rules={"minimum_booking_hours": 2, "accepted_appointment_types": ["in_person", "video_call"]}
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


class TestSlotAvailability:
    """Test slot availability checking"""
    
    def test_slot_available_no_conflicts(self, db: Session):
        """Test that a slot is available when there are no conflicts"""
        doctor = create_test_doctor(db)
        appointment_date = datetime.utcnow() + timedelta(days=1, hours=10)
        
        is_available, reason = check_slot_availability(
            db, doctor.id, appointment_date, 30
        )
        
        assert is_available is True
        assert reason is None
    
    def test_slot_unavailable_past_date(self, db: Session):
        """Test that past dates are not available"""
        doctor = create_test_doctor(db)
        appointment_date = datetime.utcnow() - timedelta(hours=1)
        
        is_available, reason = check_slot_availability(
            db, doctor.id, appointment_date, 30
        )
        
        assert is_available is False
        assert "past" in reason.lower()
    
    def test_slot_unavailable_with_conflict(self, db: Session):
        """Test that overlapping appointments are detected"""
        patient = create_test_user(db)
        doctor = create_test_doctor(db)
        
        # Create existing appointment
        existing_date = datetime.utcnow() + timedelta(days=1, hours=10)
        existing_apt = Appointment(
            patient_id=patient.id,
            doctor_id=doctor.id,
            appointment_date=existing_date,
            duration_minutes=30,
            status=AppointmentStatus.CONFIRMED
        )
        db.add(existing_apt)
        db.commit()
        
        # Try to book same slot
        is_available, reason = check_slot_availability(
            db, doctor.id, existing_date, 30
        )
        
        assert is_available is False
        assert "already booked" in reason.lower()
    
    def test_slot_available_cancelled_appointment(self, db: Session):
        """Test that cancelled appointments don't block slots"""
        patient = create_test_user(db)
        doctor = create_test_doctor(db)
        
        # Create cancelled appointment
        cancelled_date = datetime.utcnow() + timedelta(days=1, hours=10)
        cancelled_apt = Appointment(
            patient_id=patient.id,
            doctor_id=doctor.id,
            appointment_date=cancelled_date,
            duration_minutes=30,
            status=AppointmentStatus.CANCELLED
        )
        db.add(cancelled_apt)
        db.commit()
        
        # Try to book same slot
        is_available, reason = check_slot_availability(
            db, doctor.id, cancelled_date, 30
        )
        
        assert is_available is True
        assert reason is None


class TestBookingTimeValidation:
    """Test minimum booking time validation"""
    
    def test_valid_booking_time(self, db: Session):
        """Test that booking with sufficient advance time is valid"""
        doctor = create_test_doctor(db)
        create_test_schedule(db, doctor.id)
        
        appointment_date = datetime.utcnow() + timedelta(hours=3)
        
        is_valid, reason = validate_booking_time(doctor.id, appointment_date, db)
        
        assert is_valid is True
        assert reason is None
    
    def test_invalid_booking_time_too_soon(self, db: Session):
        """Test that booking too soon is rejected"""
        doctor = create_test_doctor(db)
        create_test_schedule(db, doctor.id)
        
        appointment_date = datetime.utcnow() + timedelta(hours=1)
        
        is_valid, reason = validate_booking_time(doctor.id, appointment_date, db)
        
        assert is_valid is False
        assert "advance" in reason.lower()


class TestAppointmentTypeValidation:
    """Test appointment type validation"""
    
    def test_video_consultation_accepted(self, db: Session):
        """Test that video consultations are accepted when doctor has video schedule"""
        doctor = create_test_doctor(db)
        create_test_schedule(db, doctor.id, is_video=True)
        
        is_valid, reason = validate_appointment_type(
            doctor.id, AppointmentType.VIDEO_CALL, db
        )
        
        assert is_valid is True
        assert reason is None
    
    def test_video_consultation_rejected(self, db: Session):
        """Test that video consultations are rejected when doctor doesn't support them"""
        doctor = create_test_doctor(db)
        create_test_schedule(db, doctor.id, is_video=False)
        
        is_valid, reason = validate_appointment_type(
            doctor.id, AppointmentType.VIDEO_CALL, db
        )
        
        assert is_valid is False
        assert "video" in reason.lower()
    
    def test_in_person_accepted(self, db: Session):
        """Test that in-person appointments are always accepted"""
        doctor = create_test_doctor(db)
        create_test_schedule(db, doctor.id, is_video=False)
        
        is_valid, reason = validate_appointment_type(
            doctor.id, AppointmentType.IN_PERSON, db
        )
        
        assert is_valid is True
        assert reason is None


class TestCancellationPolicy:
    """Test cancellation policy validation"""
    
    def test_can_cancel_with_sufficient_time(self, db: Session):
        """Test that appointments can be cancelled with sufficient notice"""
        patient = create_test_user(db)
        doctor = create_test_doctor(db)
        
        future_date = datetime.utcnow() + timedelta(days=2)
        appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doctor.id,
            appointment_date=future_date,
            duration_minutes=30,
            status=AppointmentStatus.CONFIRMED
        )
        
        can_cancel, reason = can_cancel_appointment(appointment, cancellation_policy_hours=24)
        
        assert can_cancel is True
        assert reason is None
    
    def test_cannot_cancel_too_late(self, db: Session):
        """Test that appointments cannot be cancelled too close to scheduled time"""
        patient = create_test_user(db)
        doctor = create_test_doctor(db)
        
        soon_date = datetime.utcnow() + timedelta(hours=12)
        appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doctor.id,
            appointment_date=soon_date,
            duration_minutes=30,
            status=AppointmentStatus.CONFIRMED
        )
        
        can_cancel, reason = can_cancel_appointment(appointment, cancellation_policy_hours=24)
        
        assert can_cancel is False
        assert "24 hours" in reason.lower()
    
    def test_cannot_cancel_already_cancelled(self, db: Session):
        """Test that already cancelled appointments cannot be cancelled again"""
        patient = create_test_user(db)
        doctor = create_test_doctor(db)
        
        future_date = datetime.utcnow() + timedelta(days=2)
        appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doctor.id,
            appointment_date=future_date,
            duration_minutes=30,
            status=AppointmentStatus.CANCELLED
        )
        
        can_cancel, reason = can_cancel_appointment(appointment)
        
        assert can_cancel is False
        assert "already cancelled" in reason.lower()


class TestTeleconsultationVerification:
    """Test teleconsultation readiness verification"""
    
    def test_teleconsultation_ready(self, db: Session):
        """Test that teleconsultation is ready when all conditions are met"""
        patient = create_test_user(db)
        doctor = create_test_doctor(db)
        
        # Appointment in 10 minutes
        appointment_date = datetime.utcnow() + timedelta(minutes=10)
        appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doctor.id,
            appointment_date=appointment_date,
            duration_minutes=30,
            appointment_type=AppointmentType.VIDEO_CALL,
            status=AppointmentStatus.CONFIRMED,
            video_call_link="https://meet.example.com/room123",
            video_call_room_id="room123"
        )
        
        is_ready, reason = verify_teleconsultation_readiness(appointment, db)
        
        assert is_ready is True
        assert reason is None
    
    def test_teleconsultation_not_ready_too_early(self, db: Session):
        """Test that teleconsultation cannot be accessed too early"""
        patient = create_test_user(db)
        doctor = create_test_doctor(db)
        
        # Appointment in 30 minutes
        appointment_date = datetime.utcnow() + timedelta(minutes=30)
        appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doctor.id,
            appointment_date=appointment_date,
            duration_minutes=30,
            appointment_type=AppointmentType.VIDEO_CALL,
            status=AppointmentStatus.CONFIRMED,
            video_call_link="https://meet.example.com/room123",
            video_call_room_id="room123"
        )
        
        is_ready, reason = verify_teleconsultation_readiness(appointment, db)
        
        assert is_ready is False
        assert "15 minutes" in reason.lower()
    
    def test_teleconsultation_not_ready_no_link(self, db: Session):
        """Test that teleconsultation fails when video link is not set up"""
        patient = create_test_user(db)
        doctor = create_test_doctor(db)
        
        appointment_date = datetime.utcnow() + timedelta(minutes=10)
        appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doctor.id,
            appointment_date=appointment_date,
            duration_minutes=30,
            appointment_type=AppointmentType.VIDEO_CALL,
            status=AppointmentStatus.CONFIRMED
        )
        
        is_ready, reason = verify_teleconsultation_readiness(appointment, db)
        
        assert is_ready is False
        assert "link not set up" in reason.lower()
    
    def test_in_person_appointment_always_ready(self, db: Session):
        """Test that in-person appointments don't need teleconsultation verification"""
        patient = create_test_user(db)
        doctor = create_test_doctor(db)
        
        appointment_date = datetime.utcnow() + timedelta(days=1)
        appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doctor.id,
            appointment_date=appointment_date,
            duration_minutes=30,
            appointment_type=AppointmentType.IN_PERSON,
            status=AppointmentStatus.CONFIRMED
        )
        
        is_ready, reason = verify_teleconsultation_readiness(appointment, db)
        
        assert is_ready is True
        assert reason is None
