"""
Endpoints for doctor-specific features
"""
from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserRole
from app.schemas import (
    AppointmentSlot,
    DoctorPatientSummary,
    DoctorProfileResponse,
    DoctorScheduleResponse,
)
from app.services.doctor_service import (
    get_available_slots_for_date,
    get_doctor_patients,
    get_doctor_schedule_entries,
)

router = APIRouter()


def _ensure_doctor(user: User) -> None:
    if user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can access this resource",
        )


@router.get("/profile", response_model=DoctorProfileResponse)
def get_doctor_profile(
    current_user: User = Depends(get_current_active_user),
):
    """Return the authenticated doctor's profile."""

    _ensure_doctor(current_user)
    return DoctorProfileResponse.model_validate(current_user)


@router.get("/patients", response_model=List[DoctorPatientSummary])
def list_doctor_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List patients for the authenticated doctor."""

    _ensure_doctor(current_user)
    return get_doctor_patients(db, doctor_id=current_user.id, skip=skip, limit=limit)


@router.get("/schedule", response_model=List[DoctorScheduleResponse])
def get_doctor_schedule(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Return the authenticated doctor's schedule definitions."""

    _ensure_doctor(current_user)
    return get_doctor_schedule_entries(db, doctor_id=current_user.id)


@router.get("/schedule/available-slots", response_model=List[AppointmentSlot])
def get_doctor_available_slots(
    target_date: date = Query(..., description="Date to compute availability for"),
    doctor_id: int | None = Query(None, description="Doctor ID (defaults to current doctor)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Return computed appointment slots for a doctor on a date."""

    _ensure_doctor(current_user)
    resolved_doctor_id = doctor_id or current_user.id

    if doctor_id and doctor_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view availability for another doctor",
        )

    return get_available_slots_for_date(
        db,
        doctor_id=resolved_doctor_id,
        target_date=target_date,
    )
