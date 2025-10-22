"""
Service layer for appointment booking and management
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from fastapi import HTTPException, status

from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.schedule import DoctorSchedule, ScheduleType
from app.models.user import User
from app.schemas.appointment import AppointmentCreate


def check_slot_availability(
    db: Session,
    doctor_id: int,
    appointment_date: datetime,
    duration_minutes: int = 30,
    exclude_appointment_id: Optional[int] = None
) -> Tuple[bool, Optional[str]]:
    """
    Check if a time slot is available for booking.
    Returns (is_available, reason_if_not_available)
    
    Implements real-time booking logic (first-come-first-served)
    """
    # Check if slot is in the past
    if appointment_date < datetime.utcnow():
        return False, "Cannot book appointments in the past"
    
    # Calculate end time for the requested slot
    slot_end = appointment_date + timedelta(minutes=duration_minutes)
    
    # Query for overlapping appointments
    query = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status.in_([
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED
        ]),
        or_(
            # New appointment starts during existing appointment
            and_(
                Appointment.appointment_date <= appointment_date,
                Appointment.appointment_date + timedelta(minutes=Appointment.duration_minutes) > appointment_date
            ),
            # New appointment ends during existing appointment
            and_(
                Appointment.appointment_date < slot_end,
                Appointment.appointment_date + timedelta(minutes=Appointment.duration_minutes) >= slot_end
            ),
            # New appointment completely contains existing appointment
            and_(
                Appointment.appointment_date >= appointment_date,
                Appointment.appointment_date + timedelta(minutes=Appointment.duration_minutes) <= slot_end
            )
        )
    )
    
    if exclude_appointment_id:
        query = query.filter(Appointment.id != exclude_appointment_id)
    
    conflicting_appointment = query.first()
    
    if conflicting_appointment:
        return False, "This time slot is already booked"
    
    return True, None


def get_minimum_booking_time(doctor_id: int, db: Session) -> int:
    """
    Get the minimum time in hours before an appointment can be booked.
    This is configurable per doctor in their schedule settings.
    Default: 2 hours
    """
    # Check doctor's schedule for custom minimum booking time
    schedule = db.query(DoctorSchedule).filter(
        DoctorSchedule.doctor_id == doctor_id,
        DoctorSchedule.is_active == True
    ).first()
    
    if schedule and schedule.custom_rules:
        return schedule.custom_rules.get('minimum_booking_hours', 2)
    
    return 2  # Default minimum booking time


def validate_booking_time(
    doctor_id: int,
    appointment_date: datetime,
    db: Session
) -> Tuple[bool, Optional[str]]:
    """
    Validate that the appointment is being booked within allowed timeframe.
    e.g., no same-day appointments if doctor requires minimum 2 hours notice
    """
    min_hours = get_minimum_booking_time(doctor_id, db)
    min_booking_time = datetime.utcnow() + timedelta(hours=min_hours)
    
    if appointment_date < min_booking_time:
        return False, f"Appointments must be booked at least {min_hours} hours in advance"
    
    return True, None


def validate_appointment_type(
    doctor_id: int,
    appointment_type: AppointmentType,
    db: Session
) -> Tuple[bool, Optional[str]]:
    """
    Check if the doctor accepts the requested appointment type.
    """
    # Get doctor's schedules to see accepted appointment types
    schedules = db.query(DoctorSchedule).filter(
        DoctorSchedule.doctor_id == doctor_id,
        DoctorSchedule.is_active == True
    ).all()
    
    if not schedules:
        return False, "Doctor has no active schedule"
    
    # Check if any schedule supports the requested type
    if appointment_type == AppointmentType.VIDEO_CALL:
        has_video_schedule = any(s.is_video_consultation for s in schedules)
        if not has_video_schedule:
            return False, "Doctor does not accept video consultations"
    
    return True, None


def can_cancel_appointment(
    appointment: Appointment,
    cancellation_policy_hours: int = 24
) -> Tuple[bool, Optional[str]]:
    """
    Check if an appointment can be cancelled based on cancellation policy.
    Default: must cancel at least 24 hours before appointment
    """
    if appointment.status == AppointmentStatus.CANCELLED:
        return False, "Appointment is already cancelled"
    
    if appointment.status == AppointmentStatus.COMPLETED:
        return False, "Cannot cancel completed appointment"
    
    hours_until_appointment = (appointment.appointment_date - datetime.utcnow()).total_seconds() / 3600
    
    if hours_until_appointment < cancellation_policy_hours:
        return False, f"Cannot cancel appointments less than {cancellation_policy_hours} hours before scheduled time"
    
    return True, None


def create_appointment_with_validation(
    db: Session,
    appointment_data: AppointmentCreate,
    patient_id: int
) -> Appointment:
    """
    Create an appointment with full validation including:
    - Slot availability check
    - Minimum booking time validation
    - Appointment type validation
    """
    # Validate appointment type is accepted
    type_valid, type_error = validate_appointment_type(
        appointment_data.doctor_id,
        appointment_data.appointment_type,
        db
    )
    if not type_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=type_error
        )
    
    # Validate booking time
    time_valid, time_error = validate_booking_time(
        appointment_data.doctor_id,
        appointment_data.appointment_date,
        db
    )
    if not time_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=time_error
        )
    
    # Check slot availability (real-time, first-come-first-served)
    slot_available, slot_error = check_slot_availability(
        db,
        appointment_data.doctor_id,
        appointment_data.appointment_date,
        appointment_data.duration_minutes
    )
    if not slot_available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=slot_error
        )
    
    # Create the appointment
    new_appointment = Appointment(
        patient_id=patient_id,
        doctor_id=appointment_data.doctor_id,
        appointment_date=appointment_data.appointment_date,
        duration_minutes=appointment_data.duration_minutes,
        appointment_type=appointment_data.appointment_type,
        reason=appointment_data.reason,
        status=AppointmentStatus.PENDING
    )
    
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    
    return new_appointment


def get_waiting_list_candidates(
    db: Session,
    doctor_id: int,
    target_date: datetime,
    limit: int = 10
) -> List[User]:
    """
    Get patients who might be interested in earlier slots if one becomes available.
    This supports the waiting list feature.
    """
    # Find patients with future appointments for this doctor
    # who might want earlier slots
    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date > target_date,
        Appointment.status.in_([
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED
        ])
    ).order_by(Appointment.appointment_date).limit(limit).all()
    
    # Get unique patients
    patient_ids = list(set(apt.patient_id for apt in appointments))
    patients = db.query(User).filter(User.id.in_(patient_ids)).all()
    
    return patients


def verify_teleconsultation_readiness(
    appointment: Appointment,
    db: Session
) -> Tuple[bool, Optional[str]]:
    """
    Verify teleconsultation requirements before appointment.
    Checks connection and access rights.
    """
    if appointment.appointment_type != AppointmentType.VIDEO_CALL:
        return True, None
    
    # Check if video call link is set up
    if not appointment.video_call_link and not appointment.video_call_room_id:
        return False, "Video call link not set up"
    
    # Check appointment is within valid timeframe (e.g., can join 15 minutes before)
    minutes_until = (appointment.appointment_date - datetime.utcnow()).total_seconds() / 60
    
    if minutes_until > 15:
        return False, "Teleconsultation can only be accessed 15 minutes before scheduled time"
    
    if minutes_until < -appointment.duration_minutes:
        return False, "Teleconsultation window has closed"
    
    return True, None
