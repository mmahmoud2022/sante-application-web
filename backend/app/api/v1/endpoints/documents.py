"""Documents endpoints: list, upload, retrieve and delete medical documents."""
import logging
import os
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserRole
from app.models.document import Document, DocumentType
from app.schemas.document import DocumentResponse
from app.services.file_service import file_service


router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("", response_model=List[DocumentResponse])
@router.get("/", response_model=List[DocumentResponse], include_in_schema=False)
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


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Download the original file for a document."""

    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    if current_user.role == UserRole.PATIENT and document.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    if current_user.role == UserRole.DOCTOR and document.uploaded_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")

    file_path = document.file_path
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file not found")

    return FileResponse(
        path=file_path,
        filename=document.file_name,
        media_type=document.mime_type or 'application/octet-stream',
    )


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def upload_document(
    document_type: str = Form(..., description="Document type value from DocumentType enum"),
    title: str = Form(..., min_length=1, max_length=200),
    patient_id: int = Form(..., description="Target patient identifier"),
    description: Optional[str] = Form(None),
    appointment_id: Optional[int] = Form(None),
    document_date: Optional[str] = Form(None, description="ISO formatted date"),
    tags: Optional[str] = Form(None),
    is_shared: Optional[bool] = Form(False),
    shared_with: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Upload a new medical document for a patient."""

    # Permission checks
    if current_user.role == UserRole.PATIENT and patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Patients can only upload documents for themselves",
        )

    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    # Convert values
    try:
        document_type_enum = DocumentType(document_type)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document type",
        ) from exc

    parsed_document_date: Optional[datetime] = None
    if document_date:
        try:
            parsed_document_date = datetime.fromisoformat(document_date)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid document_date format. Use ISO format (YYYY-MM-DD or full ISO).",
            ) from exc

    file_info = None
    try:
        file_info = await file_service.upload_file(
            file=file,
            category="medical",
            user_id=patient_id,
        )

        document = Document(
            patient_id=patient_id,
            uploaded_by=current_user.id,
            appointment_id=appointment_id,
            document_type=document_type_enum,
            title=title.strip(),
            description=description.strip() if description else None,
            file_name=file_info["original_filename"],
            file_path=file_info["file_path"],
            file_size_bytes=file_info["file_size"],
            mime_type=file_info["mime_type"],
            document_date=parsed_document_date,
            tags=tags.strip() if tags else None,
            is_shared=bool(is_shared),
            shared_with=shared_with.strip() if shared_with else None,
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        return document
    except Exception:
        db.rollback()
        # Attempt to clean up stored file if we already uploaded one
        if file_info and file_info.get("file_path"):
            file_service.delete_file(file_info["file_path"])
        raise


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a document and its stored file with permission checks."""

    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    # Permission rules
    if current_user.role == UserRole.PATIENT and document.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    if current_user.role == UserRole.DOCTOR and document.uploaded_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    # Admin can delete anything, no extra checks

    file_path = document.file_path

    try:
        db.delete(document)
        db.commit()
    except Exception:
        db.rollback()
        raise

    if file_path:
        removed = file_service.delete_file(file_path)
        if not removed:
            logger.warning(
                "Document deleted but file removal failed",
                extra={"document_id": document_id, "file_path": file_path},
            )

    return None
