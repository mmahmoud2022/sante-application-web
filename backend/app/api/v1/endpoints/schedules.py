"""
Doctor Schedule API endpoints
"""
from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.schedule import DoctorSchedule, DayOfWeek, ScheduleType
from app.schemas.schedule import (
    DoctorScheduleCreate,
    DoctorScheduleUpdate,
    DoctorScheduleResponse,
)

router = APIRouter()


@router.post("", response_model=DoctorScheduleResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=DoctorScheduleResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_schedule(
    schedule: DoctorScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new schedule (doctors only)
    """
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can create schedules",
        )

    db_schedule = DoctorSchedule(
        **schedule.dict(),
        doctor_id=current_user.id,
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


@router.get("", response_model=List[DoctorScheduleResponse])
@router.get("/", response_model=List[DoctorScheduleResponse], include_in_schema=False)
def list_schedules(
    skip: int = 0,
    limit: int = 100,
    doctor_id: Optional[int] = Query(None, description="Filter by doctor"),
    schedule_type: Optional[str] = Query(None, description="Filter by type"),
    db: Session = Depends(get_db),
):
    """
    List schedules
    """
    query = db.query(DoctorSchedule).filter(DoctorSchedule.is_active == True)

    if doctor_id:
        query = query.filter(DoctorSchedule.doctor_id == doctor_id)

    if schedule_type:
        query = query.filter(DoctorSchedule.schedule_type == schedule_type)

    schedules = query.offset(skip).limit(limit).all()
    return schedules


@router.get("/doctor/{doctor_id}", response_model=List[DoctorScheduleResponse])
def get_doctor_schedules(
    doctor_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    Get all schedules for a specific doctor
    """
    schedules = (
        db.query(DoctorSchedule)
        .filter(DoctorSchedule.doctor_id == doctor_id, DoctorSchedule.is_active == True)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return schedules


@router.get("/doctor/{doctor_id}/available-slots")
def get_available_slots(
    doctor_id: int,
    date: date = Query(..., description="Date to check availability"),
    db: Session = Depends(get_db),
):
    """
    Get available time slots for a doctor on a specific date
    """
    day_name = date.strftime("%A").lower()

    try:
        day_of_week_enum = DayOfWeek(day_name)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date provided",
        ) from exc

    # Get regular schedules for this day
    regular_schedules = (
        db.query(DoctorSchedule)
        .filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.schedule_type == ScheduleType.REGULAR,
            DoctorSchedule.day_of_week == day_of_week_enum,
            DoctorSchedule.is_active == True,
        )
        .all()
    )

    # Get exception schedules for this specific date
    exception_schedules = (
        db.query(DoctorSchedule)
        .filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.schedule_type == ScheduleType.EXCEPTION,
            DoctorSchedule.specific_date == date,
            DoctorSchedule.is_active == True,
        )
        .all()
    )

    # Check if there are any holiday/blocked schedules for this date
    blocked_schedules = (
        db.query(DoctorSchedule)
        .filter(
            DoctorSchedule.doctor_id == doctor_id,
            DoctorSchedule.schedule_type.in_([ScheduleType.HOLIDAY, ScheduleType.BLOCKED]),
            DoctorSchedule.specific_date == date,
            DoctorSchedule.is_active == True,
        )
        .first()
    )

    if blocked_schedules:
        return {"available_slots": [], "message": "Doctor is not available on this date"}

    # Use exception schedules if they exist, otherwise use regular schedules
    schedules = exception_schedules if exception_schedules else regular_schedules

    if not schedules:
        return {"available_slots": [], "message": "No schedules found for this date"}

    # Generate time slots based on schedules
    # This is a simplified version - in production, you'd also check existing appointments
    available_slots = []
    for schedule in schedules:
        # Generate slots between start_time and end_time
        # Skip break times if defined
        # This is placeholder logic
        available_slots.append({
            "time": schedule.start_time,
            "duration": schedule.slot_duration_minutes,
            "location": schedule.location,
        })

    return {"available_slots": available_slots, "date": date}


@router.get("/{schedule_id}", response_model=DoctorScheduleResponse)
def get_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
):
    """
    Get a specific schedule
    """
    schedule = db.query(DoctorSchedule).filter(DoctorSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found",
        )
    return schedule


@router.put("/{schedule_id}", response_model=DoctorScheduleResponse)
def update_schedule(
    schedule_id: int,
    schedule_update: DoctorScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a schedule (doctors can only update their own schedules)
    """
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can update schedules",
        )

    schedule = db.query(DoctorSchedule).filter(DoctorSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found",
        )

    if schedule.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this schedule",
        )

    for field, value in schedule_update.dict(exclude_unset=True).items():
        setattr(schedule, field, value)

    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete (deactivate) a schedule
    """
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can delete schedules",
        )

    schedule = db.query(DoctorSchedule).filter(DoctorSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found",
        )

    if schedule.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this schedule",
        )

    # Soft delete - just deactivate
    schedule.is_active = False
    db.commit()

    return None
