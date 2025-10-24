"""
Service layer for appointment booking and management
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone, time
from typing import List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.models.appointment import Appointment, AppointmentStatus, AppointmentType
from app.models.notification import NotificationChannel, NotificationType
from app.models.schedule import DoctorSchedule, ScheduleType
from app.models.user import User
from app.models.waiting_list import WaitingList
from app.schemas.appointment import AppointmentCreate
from app.services.notification_service import NotificationService


logger = logging.getLogger(__name__)


def _aware_utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


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
    appointment_date = _ensure_utc(appointment_date)
    now_utc = _aware_utc_now()

    if appointment_date < now_utc:
        return False, "Cannot book appointments in the past"
    
    # Calculate end time for the requested slot
    slot_end = appointment_date + timedelta(minutes=duration_minutes)

    # Limit overlap search to the same day to keep result set small
    day_start = appointment_date.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)

    query = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status.in_([
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED
        ]),
        Appointment.appointment_date >= day_start,
        Appointment.appointment_date < day_end,
    )

    if exclude_appointment_id:
        query = query.filter(Appointment.id != exclude_appointment_id)

    for existing in query.all():
        existing_start = _ensure_utc(existing.appointment_date)
        existing_end = existing_start + timedelta(minutes=existing.duration_minutes)

        # Overlap occurs when start is before the other's end and end is after the other's start
        if existing_start < slot_end and existing_end > appointment_date:
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
    min_booking_time = _aware_utc_now() + timedelta(hours=min_hours)
    
    appointment_date = _ensure_utc(appointment_date)

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
    
    appointment_dt = _ensure_utc(appointment.appointment_date)
    hours_until_appointment = (appointment_dt - _aware_utc_now()).total_seconds() / 3600
    
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
    normalized_date = _ensure_utc(appointment_data.appointment_date)

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
        normalized_date,
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
        normalized_date,
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
        appointment_date=normalized_date,
        duration_minutes=appointment_data.duration_minutes,
        appointment_type=appointment_data.appointment_type,
        reason=appointment_data.reason,
        status=AppointmentStatus.PENDING
    )
    
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    db.refresh(new_appointment, attribute_names=["doctor", "patient"])
    
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


def _deserialize_preferred_slots(raw_value: Optional[str]) -> List[str]:
    if not raw_value:
        return []

    trimmed = raw_value.strip()
    if not trimmed:
        return []

    try:
        data = json.loads(trimmed)
    except (json.JSONDecodeError, TypeError):
        return [segment.strip() for segment in trimmed.split(',') if segment.strip()]

    if isinstance(data, list):
        return [str(item).strip() for item in data if str(item).strip()]

    return []


def _parse_time_range(range_string: str) -> Optional[Tuple[time, time]]:
    cleaned = (range_string or '').strip()
    if not cleaned:
        return None

    parts = cleaned.split('-', 1)

    try:
        if len(parts) == 1:
            start = datetime.strptime(parts[0], "%H:%M").time()
            return start, start

        start_part, end_part = parts
        start = datetime.strptime(start_part.strip(), "%H:%M").time()
        end = datetime.strptime(end_part.strip(), "%H:%M").time()
        return start, end
    except ValueError:
        logger.warning("Unable to parse preferred time slot '%s'", range_string)
        return None


def _time_in_range(slot_time: time, start: time, end: time) -> bool:
    if start <= end:
        return start <= slot_time <= end
    return slot_time >= start or slot_time <= end


def _matches_waiting_list_preferences(entry: WaitingList, slot_datetime: datetime) -> bool:
    slot_datetime = _ensure_utc(slot_datetime)

    if entry.preferred_date_start and slot_datetime < entry.preferred_date_start:
        return False

    if entry.preferred_date_end and slot_datetime > entry.preferred_date_end:
        return False

    preferred_slots = _deserialize_preferred_slots(entry.preferred_time_slots)
    if not preferred_slots:
        return True

    slot_time = slot_datetime.time()
    has_valid_range = False

    for raw_slot in preferred_slots:
        parsed = _parse_time_range(raw_slot)
        if not parsed:
            continue

        has_valid_range = True
        start, end = parsed

        if start == end:
            if slot_time == start:
                return True
        elif _time_in_range(slot_time, start, end):
            return True

    return not has_valid_range


def notify_waiting_list_of_cancellation(
    db: Session,
    appointment: Appointment,
    limit: int = 10
) -> None:
    """Notify waiting list members when a slot is freed by a cancellation."""
    slot_datetime = _ensure_utc(appointment.appointment_date)

    query = (
        db.query(WaitingList)
        .options(selectinload(WaitingList.patient))
        .filter(
            WaitingList.doctor_id == appointment.doctor_id,
            WaitingList.is_active == True,  # noqa: E712
            WaitingList.notified == False,  # noqa: E712
        )
    )

    if appointment.patient_id is not None:
        query = query.filter(WaitingList.patient_id != appointment.patient_id)

    waiting_entries = (
        query
        .order_by(WaitingList.created_at.asc())
        .limit(limit)
        .all()
    )

    if not waiting_entries:
        return

    doctor_name = (
        appointment.doctor.full_name
        if getattr(appointment, "doctor", None) and appointment.doctor.full_name
        else "votre médecin"
    )

    date_label = slot_datetime.strftime("%d %B %Y")
    time_label = slot_datetime.strftime("%H:%M")

    notification_service = NotificationService(db)
    notified_any = False

    for entry in waiting_entries:
        patient = entry.patient
        if not patient:
            continue

        if not _matches_waiting_list_preferences(entry, slot_datetime):
            continue

        message = (
            f"Un créneau s'est libéré avec Dr. {doctor_name} le {date_label} à {time_label}. "
            "Connectez-vous à votre espace patient pour le réserver."
        )
        title = "Créneau disponible"

        # Always create an in-app notification as fallback
        notification_service.create_notification(
            user_id=patient.id,
            notification_type=NotificationType.SYSTEM_ALERT,
            title=title,
            message=message,
            channel=NotificationChannel.IN_APP,
            reference_id=appointment.id,
            reference_type="waiting_list",
        )

        if patient.email:
            notification_service.create_notification(
                user_id=patient.id,
                notification_type=NotificationType.SYSTEM_ALERT,
                title=title,
                message=message,
                channel=NotificationChannel.EMAIL,
                reference_id=appointment.id,
                reference_type="waiting_list",
            )

        if getattr(patient, "phone", None):
            notification_service.create_notification(
                user_id=patient.id,
                notification_type=NotificationType.SYSTEM_ALERT,
                title=title,
                message=message,
                channel=NotificationChannel.SMS,
                reference_id=appointment.id,
                reference_type="waiting_list",
            )

        entry.notified = True
        entry.notified_at = _aware_utc_now()
        entry.is_active = False
        notified_any = True

    if notified_any:
        db.commit()
        logger.info(
            "Waiting list notification dispatched",
            extra={
                "doctor_id": appointment.doctor_id,
                "appointment_id": appointment.id,
                "notified_count": sum(1 for entry in waiting_entries if entry.notified),
            },
        )

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
    appointment_dt = _ensure_utc(appointment.appointment_date)
    minutes_until = (appointment_dt - _aware_utc_now()).total_seconds() / 60
    
    if minutes_until > 15:
        return False, "Teleconsultation can only be accessed 15 minutes before scheduled time"
    
    if minutes_until < -appointment.duration_minutes:
        return False, "Teleconsultation window has closed"
    
    return True, None
