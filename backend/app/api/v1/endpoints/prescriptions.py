"""
Prescription API endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.prescription import Prescription
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionResponse,
)

router = APIRouter()


@router.post("", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_prescription(
    prescription: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new prescription (doctors only)
    """
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can create prescriptions",
        )

    db_prescription = Prescription(
        **prescription.dict(),
        doctor_id=current_user.id,
    )
    db.add(db_prescription)
    db.commit()
    db.refresh(db_prescription)
    return db_prescription


@router.get("", response_model=List[PrescriptionResponse])
@router.get("/", response_model=List[PrescriptionResponse], include_in_schema=False)
def list_prescriptions(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List prescriptions
    - Patients see their own prescriptions
    - Doctors see prescriptions they created
    - Admins see all prescriptions
    """
    query = db.query(Prescription)

    if current_user.role == "patient":
        query = query.filter(Prescription.patient_id == current_user.id)
    elif current_user.role == "doctor":
        query = query.filter(Prescription.doctor_id == current_user.id)

    if status:
        query = query.filter(Prescription.status == status)

    prescriptions = query.offset(skip).limit(limit).all()
    return prescriptions


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
def get_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific prescription
    """
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found",
        )

    # Check authorization
    if current_user.role == "patient" and prescription.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this prescription",
        )
    elif current_user.role == "doctor" and prescription.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this prescription",
        )

    return prescription


@router.put("/{prescription_id}", response_model=PrescriptionResponse)
def update_prescription(
    prescription_id: int,
    prescription_update: PrescriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a prescription (doctors only, only their own prescriptions)
    """
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can update prescriptions",
        )

    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found",
        )

    if prescription.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this prescription",
        )

    for field, value in prescription_update.dict(exclude_unset=True).items():
        setattr(prescription, field, value)

    db.commit()
    db.refresh(prescription)
    return prescription


@router.post("/{prescription_id}/renew", response_model=PrescriptionResponse)
def renew_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Renew a prescription (patients can request, creates new prescription)
    """
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found",
        )

    # Patients can only renew their own prescriptions
    if current_user.role == "patient" and prescription.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to renew this prescription",
        )

    # Check if refills are available
    if prescription.refills_remaining <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No refills remaining. Please contact your doctor.",
        )

    # Decrement refills
    prescription.refills_remaining -= 1
    db.commit()
    db.refresh(prescription)

    return prescription


@router.delete("/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_prescription(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cancel a prescription (doctors only, their own prescriptions)
    """
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can cancel prescriptions",
        )

    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found",
        )

    if prescription.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this prescription",
        )

    prescription.status = "cancelled"
    db.commit()

    return None
