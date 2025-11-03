"""Prescription API endpoints, including upload support."""
import json
from typing import List, Optional
from datetime import datetime, date

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.prescription import Prescription
from app.models.document import Document, DocumentType
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionResponse,
)
from app.services.file_service import file_service

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
    print(f"🔍 DEBUG: Creating prescription - Doctor: {current_user.id}, Patient: {prescription.patient_id}")
    print(f"📋 DEBUG: Prescription data: {prescription.dict()}")
    
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can create prescriptions",
        )

    document = None
    if prescription.document_id is not None:
        document = db.query(Document).filter(Document.id == prescription.document_id).first()
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated document not found",
            )
        if document.patient_id != prescription.patient_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document does not belong to the specified patient",
            )

    # Convert date strings to datetime objects if needed
    prescription_dict = prescription.dict()
    if prescription_dict.get('start_date') and isinstance(prescription_dict['start_date'], str):
        prescription_dict['start_date'] = datetime.fromisoformat(prescription_dict['start_date'].replace('Z', '+00:00'))
    if prescription_dict.get('end_date') and isinstance(prescription_dict['end_date'], str):
        prescription_dict['end_date'] = datetime.fromisoformat(prescription_dict['end_date'].replace('Z', '+00:00'))

    db_prescription = Prescription(
        **prescription_dict,
        doctor_id=current_user.id,
    )
    # Initialize refills_remaining to the number of allowed refills when creating new prescriptions
    db_prescription.refills_remaining = prescription.refills_allowed

    print(f"💾 DEBUG: Saving prescription to database - Patient ID: {db_prescription.patient_id}, Doctor ID: {db_prescription.doctor_id}")

    if document is not None:
        db_prescription.document = document

    db.add(db_prescription)
    db.commit()
    db.refresh(db_prescription)
    
    print(f"✅ DEBUG: Prescription created successfully - ID: {db_prescription.id}")
    
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
    print(f"🔍 DEBUG: Listing prescriptions - User: {current_user.id}, Role: {current_user.role}")
    
    query = db.query(Prescription).options(selectinload(Prescription.document))

    if current_user.role == "patient":
        query = query.filter(Prescription.patient_id == current_user.id)
        print(f"👤 DEBUG: Filtering by patient_id: {current_user.id}")
    elif current_user.role == "doctor":
        query = query.filter(Prescription.doctor_id == current_user.id)
        print(f"👨‍⚕️ DEBUG: Filtering by doctor_id: {current_user.id}")

    if status:
        query = query.filter(Prescription.status == status)
        print(f"🏷️ DEBUG: Filtering by status: {status}")

    prescriptions = query.offset(skip).limit(limit).all()
    print(f"📊 DEBUG: Found {len(prescriptions)} prescriptions")
    
    for p in prescriptions:
        print(f"  - Prescription ID: {p.id}, Patient: {p.patient_id}, Doctor: {p.doctor_id}, Status: {p.status}")
    
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
    prescription = (
        db.query(Prescription)
        .options(selectinload(Prescription.document))
        .filter(Prescription.id == prescription_id)
        .first()
    )
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

    update_data = prescription_update.dict(exclude_unset=True)

    if "document_id" in update_data:
        new_document_id = update_data["document_id"]
        if new_document_id is None:
            prescription.document = None
        else:
            document = db.query(Document).filter(Document.id == new_document_id).first()
            if not document:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Associated document not found",
                )
            if document.patient_id != prescription.patient_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Document does not belong to the specified patient",
                )
            prescription.document = document
        update_data.pop("document_id")

    for field, value in update_data.items():
        setattr(prescription, field, value)

    db.commit()
    db.refresh(prescription)
    return prescription


@router.post("/upload", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
@router.post(
    "/upload/",
    response_model=PrescriptionResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
async def upload_prescription(
    prescription_payload: str = Form(..., description="JSON encoded PrescriptionCreate payload"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a prescription document and create the associated prescription (doctors only)."""

    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can upload prescriptions",
        )

    try:
        payload = json.loads(prescription_payload)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload for prescription data",
        ) from exc

    prescription_data = PrescriptionCreate(**payload)

    document = None
    file_info = None
    try:
        file_info = await file_service.upload_file(
            file=file,
            category="medical",
            user_id=current_user.id,
        )

        document = Document(
            patient_id=prescription_data.patient_id,
            uploaded_by=current_user.id,
            appointment_id=prescription_data.appointment_id,
            document_type=DocumentType.PRESCRIPTION,
            title=prescription_data.medication_name or file.filename,
            description=prescription_data.notes,
            file_name=file_info["original_filename"],
            file_path=file_info["file_path"],
            file_size_bytes=file_info["file_size"],
            mime_type=file_info["mime_type"],
        )

        db.add(document)
        db.flush()

        prescription_dict = prescription_data.model_dump()
        prescription_dict["document_id"] = document.id

        db_prescription = Prescription(
            **prescription_dict,
            doctor_id=current_user.id,
        )
        db_prescription.refills_remaining = prescription_data.refills_allowed

        db.add(db_prescription)
        db.commit()
    except Exception:
        db.rollback()
        # Attempt to clean up stored file if we already uploaded one
        cleanup_path = None
        if document and document.file_path:
            cleanup_path = document.file_path
        elif file_info:
            cleanup_path = file_info.get("file_path")
        if cleanup_path:
            file_service.delete_file(cleanup_path)
        raise

    db.refresh(db_prescription)
    db.refresh(db_prescription, attribute_names=["document"])
    return db_prescription


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
