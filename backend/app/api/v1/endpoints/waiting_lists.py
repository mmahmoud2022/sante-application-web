"""
Waiting list API endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserRole
from app.models.waiting_list import WaitingList
from app.schemas.waiting_list import (
    WaitingListCreate,
    WaitingListUpdate,
    WaitingListResponse,
)

router = APIRouter()


@router.post("", response_model=WaitingListResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=WaitingListResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_waiting_list_entry(
    waiting_list: WaitingListCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Join a waiting list for earlier appointment slots.
    
    When a slot becomes available (e.g., due to cancellation),
    patients on the waiting list will be notified.
    """
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can join waiting lists"
        )
    
    # Check if already on waiting list for this doctor
    existing = db.query(WaitingList).filter(
        WaitingList.patient_id == current_user.id,
        WaitingList.doctor_id == waiting_list.doctor_id,
        WaitingList.is_active == True
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already on waiting list for this doctor"
        )
    
    db_waiting_list = WaitingList(
        patient_id=current_user.id,
        doctor_id=waiting_list.doctor_id,
        preferred_date_start=waiting_list.preferred_date_start,
        preferred_date_end=waiting_list.preferred_date_end,
        preferred_time_slots=waiting_list.preferred_time_slots,
        appointment_reason=waiting_list.appointment_reason,
    )
    
    db.add(db_waiting_list)
    db.commit()
    db.refresh(db_waiting_list)
    
    return db_waiting_list


@router.get("", response_model=List[WaitingListResponse])
@router.get("/", response_model=List[WaitingListResponse], include_in_schema=False)
def list_waiting_list_entries(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List waiting list entries.
    
    - Patients see their own entries
    - Doctors see entries for appointments with them
    - Admins see all entries
    """
    query = db.query(WaitingList)
    
    if current_user.role == UserRole.PATIENT:
        query = query.filter(WaitingList.patient_id == current_user.id)
    elif current_user.role == UserRole.DOCTOR:
        query = query.filter(WaitingList.doctor_id == current_user.id)
    
    return query.offset(skip).limit(limit).all()


@router.get("/{waiting_list_id}", response_model=WaitingListResponse)
def get_waiting_list_entry(
    waiting_list_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get waiting list entry by ID
    """
    entry = db.query(WaitingList).filter(WaitingList.id == waiting_list_id).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waiting list entry not found"
        )
    
    # Check permissions
    if (current_user.role == UserRole.PATIENT and entry.patient_id != current_user.id) or \
       (current_user.role == UserRole.DOCTOR and entry.doctor_id != current_user.id):
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    return entry


@router.put("/{waiting_list_id}", response_model=WaitingListResponse)
def update_waiting_list_entry(
    waiting_list_id: int,
    waiting_list_update: WaitingListUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update waiting list entry
    """
    entry = db.query(WaitingList).filter(WaitingList.id == waiting_list_id).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waiting list entry not found"
        )
    
    # Check permissions - only patient can update their own entry
    if entry.patient_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Update entry
    update_data = waiting_list_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entry, field, value)
    
    db.commit()
    db.refresh(entry)
    
    return entry


@router.delete("/{waiting_list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_waiting_list_entry(
    waiting_list_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Remove from waiting list (deactivate entry)
    """
    entry = db.query(WaitingList).filter(WaitingList.id == waiting_list_id).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Waiting list entry not found"
        )
    
    # Check permissions
    if entry.patient_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Soft delete - deactivate
    entry.is_active = False
    db.commit()
    
    return None
