"""Appointment management endpoints."""
import logging
from datetime import datetime, date as date_type, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserRole
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
    AppointmentCancelRequest,
)
from app.schemas.doctor import AppointmentSlot
from app.services import doctor_service
from app.services.appointment_service import (
    create_appointment_with_validation,
    can_cancel_appointment,
    notify_waiting_list_of_cancellation,
    verify_teleconsultation_readiness,
)

router = APIRouter()

logger = logging.getLogger(__name__)


@router.get("/available-slots", response_model=dict)
def get_available_slots(
    doctor_id: int = Query(..., description="Doctor ID"),
    date: str = Query(..., description="Target date in YYYY-MM-DD format"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Return available appointment slots for a doctor on a given date.

    Mirrors the logic used by schedules and patient booking helpers, exposed
    under the appointments router to satisfy frontend expectations.
    """
    try:
        target_date: date_type = date_type.fromisoformat(date)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid date format. Use YYYY-MM-DD.",
        ) from exc

    slots: List[AppointmentSlot] = doctor_service.get_available_slots_for_date(
        db, doctor_id=doctor_id, target_date=target_date
    )

    # Shape matches other helpers: return simple dict with slots
    return {
        "doctor_id": doctor_id,
        "date": target_date.isoformat(),
        "slots": [slot.model_dump() for slot in slots],
    }


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_appointment(
    appointment: AppointmentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new appointment with validation
    
    Implements:
    - Real-time slot availability checking (first-come-first-served)
    - Minimum booking time validation
    - Appointment type validation
    - Automatic slot blocking
    
    Patients can create appointments for themselves
    """
    appointment_datetime = appointment.appointment_date

    if appointment.appointment_time:
        try:
            time_value = datetime.strptime(appointment.appointment_time, "%H:%M").time()
        except ValueError as exc:  # pragma: no cover - defensive
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid appointment_time format. Use HH:MM."
            ) from exc

        appointment_datetime = appointment_datetime.replace(
            hour=time_value.hour,
            minute=time_value.minute,
            second=0,
            microsecond=0,
        )
    
    # Update appointment_date with combined datetime
    appointment.appointment_date = appointment_datetime
    
    # Use the new validation service
    db_appointment = create_appointment_with_validation(
        db=db,
        appointment_data=appointment,
        patient_id=current_user.id
    )
    
    return db_appointment


@router.get("", response_model=List[AppointmentResponse])
@router.get("/", response_model=List[AppointmentResponse], include_in_schema=False)
def list_appointments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List appointments
    
    - Patients see their own appointments
    - Doctors see appointments with them
    - Admins see all appointments
    """
    from app.models.appointment import Appointment
    
    query = db.query(Appointment).options(
        selectinload(Appointment.doctor),
        selectinload(Appointment.patient),
    )
    
    if current_user.role == UserRole.PATIENT:
        query = query.filter(Appointment.patient_id == current_user.id)
    elif current_user.role == UserRole.DOCTOR:
        query = query.filter(Appointment.doctor_id == current_user.id)
    
    return query.offset(skip).limit(limit).all()


@router.patch("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: int,
    payload: AppointmentCancelRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Cancel an appointment by ID with cancellation policy validation.
    
    Implements:
    - Cancellation policy (24-hour rule by default)
    - Waiting list notification for earlier slots
    
    - Patients can cancel their own appointments
    - Doctors can cancel appointments with them
    - Admins can cancel any appointment
    """
    from app.models.appointment import Appointment, AppointmentStatus

    appointment = (
        db.query(Appointment)
        .options(
            selectinload(Appointment.doctor),
            selectinload(Appointment.patient),
        )
        .filter(Appointment.id == appointment_id)
        .first()
    )

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    # Check permissions
    if appointment.patient_id != current_user.id and appointment.doctor_id != current_user.id:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
    
    # Check cancellation policy
    can_cancel, cancel_error = can_cancel_appointment(appointment, cancellation_policy_hours=24)
    if not can_cancel:
        # Allow doctors and admins to override cancellation policy
        if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=cancel_error
            )

    appointment.status = AppointmentStatus.CANCELLED
    appointment.cancelled_by = current_user.id
    appointment.cancelled_at = datetime.now(timezone.utc)
    if payload and payload.reason:
        appointment.cancellation_reason = payload.reason

    db.commit()
    db.refresh(appointment)
    db.refresh(appointment, attribute_names=["doctor", "patient"])

    try:
        notify_waiting_list_of_cancellation(db, appointment)
    except Exception:  # pragma: no cover - defensive logging
        logger.exception(
            "Failed to notify waiting list after cancellation",
            extra={
                "appointment_id": appointment_id,
                "doctor_id": appointment.doctor_id,
            },
        )

    return appointment


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get appointment by ID
    """
    from app.models.appointment import Appointment
    
    appointment = (
        db.query(Appointment)
        .options(
            selectinload(Appointment.doctor),
            selectinload(Appointment.patient),
        )
        .filter(Appointment.id == appointment_id)
        .first()
    )
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Check permissions
    if (current_user.role == UserRole.PATIENT and appointment.patient_id != current_user.id) or \
       (current_user.role == UserRole.DOCTOR and appointment.doctor_id != current_user.id):
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    appointment_update: AppointmentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update appointment (including reschedule)
    """
    from app.models.appointment import Appointment
    
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Check permissions
    if (current_user.role == UserRole.PATIENT and appointment.patient_id != current_user.id) or \
       (current_user.role == UserRole.DOCTOR and appointment.doctor_id != current_user.id):
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    # Handle appointment_time if provided (for reschedule)
    if appointment_update.appointment_time and appointment_update.appointment_date:
        try:
            time_value = datetime.strptime(appointment_update.appointment_time, "%H:%M").time()
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid appointment_time format. Use HH:MM."
            ) from exc

        # Combine date and time
        appointment_datetime = appointment_update.appointment_date.replace(
            hour=time_value.hour,
            minute=time_value.minute,
            second=0,
            microsecond=0,
        )
        appointment_update.appointment_date = appointment_datetime
    
    # Update appointment
    update_data = appointment_update.model_dump(exclude_unset=True)
    # Remove appointment_time from update_data as it's already processed
    update_data.pop('appointment_time', None)
    
    for field, value in update_data.items():
        setattr(appointment, field, value)
    
    db.commit()
    db.refresh(appointment)
    db.refresh(appointment, attribute_names=["doctor", "patient"])
    
    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Cancel/delete appointment
    """
    from app.models.appointment import Appointment, AppointmentStatus
    
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Check permissions
    if appointment.patient_id != current_user.id and appointment.doctor_id != current_user.id:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    # Mark as cancelled instead of deleting
    appointment.status = AppointmentStatus.CANCELLED
    appointment.cancelled_by = current_user.id
    appointment.cancelled_at = datetime.now(timezone.utc)
    
    db.commit()
    
    return None


@router.get("/stats/overview", response_model=dict)
def get_appointment_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get appointment statistics
    
    Admin can see all stats, users see their own stats
    """
    from app.models.appointment import Appointment, AppointmentStatus
    from sqlalchemy import func
    
    query = db.query(Appointment)
    
    # Filter based on user role
    if current_user.role == UserRole.PATIENT:
        query = query.filter(Appointment.patient_id == current_user.id)
    elif current_user.role == UserRole.DOCTOR:
        query = query.filter(Appointment.doctor_id == current_user.id)
    # Admin sees all
    
    total_appointments = query.count()
    
    # Count by status
    status_counts = {}
    for status in AppointmentStatus:
        count = query.filter(Appointment.status == status).count()
        status_counts[status.value] = count
    
    # Count cancellations
    cancelled_appointments = query.filter(Appointment.status == AppointmentStatus.CANCELLED).all()
    cancelled_by_patient = sum(1 for apt in cancelled_appointments if apt.cancelled_by == apt.patient_id)
    cancelled_by_doctor = sum(1 for apt in cancelled_appointments if apt.cancelled_by == apt.doctor_id)
    
    return {
        "total_appointments": total_appointments,
        "status_counts": status_counts,
        "cancelled_by_patient": cancelled_by_patient,
        "cancelled_by_doctor": cancelled_by_doctor
    }


@router.get("/{appointment_id}/teleconsultation-status", response_model=dict)
def check_teleconsultation_status(
    appointment_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Verify teleconsultation readiness for an appointment.
    
    Checks:
    - Connection setup
    - Access rights
    - Time window validity
    """
    from app.models.appointment import Appointment
    
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Check permissions
    if appointment.patient_id != current_user.id and appointment.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Verify teleconsultation readiness
    is_ready, error_message = verify_teleconsultation_readiness(appointment, db)
    
    return {
        "ready": is_ready,
        "message": error_message if not is_ready else "Teleconsultation is ready",
        "video_call_link": appointment.video_call_link if is_ready else None,
        "waiting_room_enabled": appointment.waiting_room_enabled
    }
