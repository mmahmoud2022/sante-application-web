"""
Appointment management endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserRole
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse

router = APIRouter()


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appointment: AppointmentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new appointment
    
    Patients can create appointments for themselves
    """
    from app.models.appointment import Appointment
    
    # Create appointment
    db_appointment = Appointment(
        patient_id=current_user.id,
        doctor_id=appointment.doctor_id,
        appointment_date=appointment.appointment_date,
        duration_minutes=appointment.duration_minutes,
        appointment_type=appointment.appointment_type,
        reason=appointment.reason
    )
    
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    
    return db_appointment


@router.get("/", response_model=List[AppointmentResponse])
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
    
    query = db.query(Appointment)
    
    if current_user.role == UserRole.PATIENT:
        query = query.filter(Appointment.patient_id == current_user.id)
    elif current_user.role == UserRole.DOCTOR:
        query = query.filter(Appointment.doctor_id == current_user.id)
    
    return query.offset(skip).limit(limit).all()


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
    
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    appointment_update: AppointmentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update appointment
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
    
    # Update appointment
    update_data = appointment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)
    
    db.commit()
    db.refresh(appointment)
    
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
    from datetime import datetime
    
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
    appointment.cancelled_at = datetime.utcnow()
    
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
