"""
Endpoints for patient helpers
"""
from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserRole
from app.schemas import (
    AppointmentBookingDoctor,
    AppointmentBookingResponse,
)
from app.services.doctor_service import get_available_slots_for_date
from app.services.user_service import get_doctors, get_user_by_id

router = APIRouter()


def _ensure_patient(user: User) -> None:
    if user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can access this resource",
        )


def _map_doctor(user: User) -> AppointmentBookingDoctor:
    return AppointmentBookingDoctor(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        specialization=getattr(user, "specialization", None),
        city=getattr(user, "city", None),
        rating_average=getattr(user, "rating_average", None),
        rating_count=getattr(user, "rating_count", None),
        consultation_fee=getattr(user, "consultation_fee", None),
    )


@router.get("/book-appointment", response_model=AppointmentBookingResponse)
def get_book_appointment_context(
    doctor: int | None = Query(None, description="Preselected doctor ID"),
    appointment_date: date | None = Query(None, alias="date"),
    specialty: str | None = Query(None, description="Filter by specialty"),
    city: str | None = Query(None, description="Filter by city/location"),
    postal_code: str | None = Query(None, description="Filter by postal code"),
    reason: str | None = Query(None, description="Reason for consultation"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Provide helper data for the appointment booking experience.
    
    Supports searching practitioners by:
    - Specialty (e.g., dermatologist, dentist, general practitioner)
    - Location (city, postal code)
    - Reason for consultation (stored for appointment creation)
    """

    _ensure_patient(current_user)

    # Enhanced doctor search with filters
    doctors = get_doctors(
        db,
        limit=limit,
        specialization=specialty,
        city=city or postal_code,  # Use postal_code as city fallback
    )
    doctor_payload: List[AppointmentBookingDoctor] = [_map_doctor(doc) for doc in doctors]

    response = AppointmentBookingResponse(doctors=doctor_payload)

    if doctor is not None:
        selected = next((doc for doc in doctors if doc.id == doctor), None)
        if selected is None:
            selected_user = get_user_by_id(db, doctor)
            if not selected_user or selected_user.role != UserRole.DOCTOR:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
            selected = selected_user

        response.selected_doctor = _map_doctor(selected)

        if appointment_date is not None:
            slots = get_available_slots_for_date(
                db,
                doctor_id=selected.id,
                target_date=appointment_date,
            )
            response.available_slots = slots or []

    return response


@router.get("/search-doctors", response_model=dict)
def search_doctors(
    specialty: str | None = Query(None, description="Filter by specialty"),
    city: str | None = Query(None, description="Filter by city/location"),
    postal_code: str | None = Query(None, description="Filter by postal code"),
    search: str | None = Query(None, description="Search by name or specialty"),
    min_rating: float | None = Query(None, ge=0, le=5, description="Minimum rating"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Advanced doctor search endpoint.
    
    Allows patients to search for practitioners by:
    - Specialty (e.g., dermatologist, dentist, general practitioner)
    - Location (city, postal code, distance)
    - Name or specialty text search
    - Minimum rating
    """
    _ensure_patient(current_user)

    doctors = get_doctors(
        db,
        limit=limit,
        specialization=specialty,
        city=city or postal_code,
        min_rating=min_rating,
        accepting_new_patients=True,
        search=search
    )
    
    doctor_list = [_map_doctor(doc) for doc in doctors]
    
    return {
        "total": len(doctor_list),
        "doctors": doctor_list
    }
