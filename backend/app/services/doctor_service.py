"""
Service layer helpers for doctor-specific features
"""
from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import List, Optional

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.models.appointment import Appointment
from app.models.schedule import DayOfWeek, DoctorSchedule, ScheduleType
from app.models.user import User
from app.schemas.doctor import AppointmentSlot, DoctorPatientSummary


_DAY_INDEX_TO_ENUM = {
    0: DayOfWeek.MONDAY,
    1: DayOfWeek.TUESDAY,
    2: DayOfWeek.WEDNESDAY,
    3: DayOfWeek.THURSDAY,
    4: DayOfWeek.FRIDAY,
    5: DayOfWeek.SATURDAY,
    6: DayOfWeek.SUNDAY,
}


def get_doctor_patients(
    db: Session,
    *,
    doctor_id: int,
    skip: int = 0,
    limit: int = 100,
) -> List[DoctorPatientSummary]:
    """Return the unique patients for a doctor with visit metadata."""

    rows = (
        db.query(
            User,
            func.max(Appointment.appointment_date).label("last_visit"),
            func.min(
                case(
                    (Appointment.appointment_date > func.now(), Appointment.appointment_date),
                    else_=None,
                )
            ).label("next_visit"),
        )
        .join(Appointment, Appointment.patient_id == User.id)
        .filter(Appointment.doctor_id == doctor_id)
        .group_by(User.id)
        .order_by(func.max(Appointment.appointment_date).desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    patients: List[DoctorPatientSummary] = []
    for patient, last_visit, next_visit in rows:
        patients.append(
            DoctorPatientSummary(
                id=patient.id,
                first_name=patient.first_name,
                last_name=patient.last_name,
                email=patient.email,
                phone=getattr(patient, "phone", None),
                last_appointment_date=last_visit,
                next_appointment_date=next_visit,
            )
        )

    return patients


def get_doctor_schedule_entries(db: Session, *, doctor_id: int) -> List[DoctorSchedule]:
    """Return the schedule entries for a doctor."""

    return (
        db.query(DoctorSchedule)
        .filter(DoctorSchedule.doctor_id == doctor_id)
        .order_by(DoctorSchedule.schedule_type, DoctorSchedule.day_of_week, DoctorSchedule.start_time)
        .all()
    )


def _combine(date_value: date, time_value: time) -> datetime:
    """Combine date and time into timezone-naive datetime."""

    return datetime.combine(date_value, time_value)


def _generate_slots_for_schedule(
    schedule: DoctorSchedule,
    target_date: date,
) -> List[AppointmentSlot]:
    """Generate appointment slots from a schedule definition."""

    slots: List[AppointmentSlot] = []
    start_dt = _combine(target_date, schedule.start_time)
    end_dt = _combine(target_date, schedule.end_time)

    step = timedelta(minutes=schedule.slot_duration_minutes)
    buffer_delta = timedelta(minutes=schedule.buffer_time_minutes or 0)

    current = start_dt
    while current + step <= end_dt:
        slots.append(
            AppointmentSlot(
                time=current.strftime("%H:%M"),
                duration=schedule.slot_duration_minutes,
                location=schedule.location,
            )
        )
        current = current + step + buffer_delta

    return slots


def get_available_slots_for_date(
    db: Session,
    *,
    doctor_id: int,
    target_date: date,
) -> List[AppointmentSlot]:
    """Calculate available appointment slots for a doctor on a given date."""

    # Check for blocked/holiday entries first
    blocked_entry = (
        db.query(DoctorSchedule)
        .filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.schedule_type.in_([ScheduleType.HOLIDAY, ScheduleType.BLOCKED]),
        )
        .filter(DoctorSchedule.specific_date.isnot(None))
        .filter(func.date(DoctorSchedule.specific_date) == target_date)
        .first()
    )
    if blocked_entry:
        return []

    # Exception schedules override regular schedules
    exception_schedules = (
        db.query(DoctorSchedule)
        .filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.schedule_type == ScheduleType.EXCEPTION,
        )
        .filter(DoctorSchedule.specific_date.isnot(None))
        .filter(func.date(DoctorSchedule.specific_date) == target_date)
        .filter(DoctorSchedule.is_available == True)
        .all()
    )

    if exception_schedules:
        schedules = exception_schedules
    else:
        day_enum = _DAY_INDEX_TO_ENUM[target_date.weekday()]
        schedules = (
            db.query(DoctorSchedule)
            .filter(
                DoctorSchedule.doctor_id == doctor_id,
                DoctorSchedule.schedule_type == ScheduleType.REGULAR,
                DoctorSchedule.day_of_week == day_enum,
                DoctorSchedule.is_available == True,
            )
            .all()
        )

    slots: List[AppointmentSlot] = []
    for schedule in schedules:
        slots.extend(_generate_slots_for_schedule(schedule, target_date))

    return slots
