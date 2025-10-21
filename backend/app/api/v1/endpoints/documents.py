"""Documents endpoints: list and retrieve medical documents."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserRole
from app.models.document import Document
from app.schemas.document import DocumentResponse


router = APIRouter()


@router.get("/", response_model=List[DocumentResponse])
def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    patient_id: Optional[int] = Query(None, description="Filter by patient ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    List documents.

    - Patients: only their own documents (patient_id forced to current user)
    - Doctors/Admins: can filter by patient_id. If not provided, returns no documents by default.
    """
    query = db.query(Document)

    if current_user.role == UserRole.PATIENT:
        query = query.filter(Document.patient_id == current_user.id)
    else:
        # Admin/Doctor path
        if patient_id is not None:
            query = query.filter(Document.patient_id == patient_id)
        else:
            # Conservative default: avoid leaking documents unintentionally
            query = query.filter(Document.id == -1)

    return (
        query.order_by(Document.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve a single document by ID with permission checks."""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if current_user.role == UserRole.PATIENT and document.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    # Doctors can see only if it belongs to a patient they query explicitly elsewhere; admins can see all
    # Keeping it permissive for admins, restrictive for doctors unless business logic expands.
    if current_user.role == UserRole.DOCTOR:
        # As a baseline, allow access if doctor uploaded it
        if document.uploaded_by != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    return document
