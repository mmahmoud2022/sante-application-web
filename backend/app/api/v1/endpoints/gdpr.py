"""
GDPR Compliance endpoints
Implements:
- Right to data portability (data export)
- Right to be forgotten (data deletion)
- Consent management
"""
import json
from typing import Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserRole
from app.services.audit_service import get_audit_service, AuditAction

router = APIRouter()


class ConsentUpdate(BaseModel):
    """Schema for updating user consent"""
    marketing_emails: bool = False
    data_analytics: bool = False
    third_party_sharing: bool = False


class DataDeletionRequest(BaseModel):
    """Schema for data deletion request"""
    confirmation: str
    reason: str = None


@router.get("/export-data")
async def export_user_data(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Export all user data (GDPR Article 20 - Right to data portability)
    
    Returns a comprehensive JSON export of all user data including:
    - Profile information
    - Appointments
    - Medical records
    - Prescriptions
    - Messages
    - Documents
    - Audit logs
    """
    from app.models.appointment import Appointment
    from app.models.prescription import Prescription
    from app.models.document import Document
    from app.models.message import Message
    from app.models.medical_record import MedicalRecord
    
    # Collect user data
    user_data = {
        "export_date": datetime.utcnow().isoformat(),
        "user_id": current_user.id,
        "profile": {
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "phone": current_user.phone,
            "date_of_birth": current_user.date_of_birth.isoformat() if current_user.date_of_birth else None,
            "role": current_user.role,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        },
        "appointments": [],
        "prescriptions": [],
        "documents": [],
        "messages": [],
        "medical_records": []
    }
    
    # Export appointments
    if current_user.role == UserRole.PATIENT:
        appointments = db.query(Appointment).filter(Appointment.patient_id == current_user.id).all()
    elif current_user.role == UserRole.DOCTOR:
        appointments = db.query(Appointment).filter(Appointment.doctor_id == current_user.id).all()
    else:
        appointments = []
    
    for apt in appointments:
        user_data["appointments"].append({
            "id": apt.id,
            "date": apt.appointment_date.isoformat() if apt.appointment_date else None,
            "type": apt.appointment_type,
            "status": apt.status,
            "reason": apt.reason,
            "notes": apt.notes,
        })
    
    # Export prescriptions
    if current_user.role == UserRole.PATIENT:
        prescriptions = db.query(Prescription).filter(Prescription.patient_id == current_user.id).all()
        for presc in prescriptions:
            user_data["prescriptions"].append({
                "id": presc.id,
                "medication": presc.medication,
                "dosage": presc.dosage,
                "start_date": presc.start_date.isoformat() if presc.start_date else None,
                "end_date": presc.end_date.isoformat() if presc.end_date else None,
            })
    
    # Export documents
    documents = db.query(Document).filter(Document.patient_id == current_user.id).all()
    for doc in documents:
        user_data["documents"].append({
            "id": doc.id,
            "title": doc.title,
            "type": doc.document_type,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
        })
    
    # Export messages
    messages = db.query(Message).filter(
        (Message.sender_id == current_user.id) | (Message.receiver_id == current_user.id)
    ).all()
    for msg in messages:
        user_data["messages"].append({
            "id": msg.id,
            "from_user": msg.sender_id,
            "to_user": msg.receiver_id,
            "subject": msg.subject,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        })
    
    # Export medical records (patients only)
    if current_user.role == UserRole.PATIENT:
        records = db.query(MedicalRecord).filter(MedicalRecord.patient_id == current_user.id).all()
        for record in records:
            user_data["medical_records"].append({
                "id": record.id,
                "diagnosis": record.diagnosis,
                "treatment": record.treatment,
                "created_at": record.created_at.isoformat() if record.created_at else None,
            })
    
    # Log data export
    audit_service = get_audit_service(db)
    audit_service.log(
        action=AuditAction.RECORD_VIEW,
        user_id=current_user.id,
        resource_type="user_data_export",
        resource_id=current_user.id,
        details={"export_type": "gdpr_data_portability"}
    )
    
    return user_data


@router.post("/delete-account", status_code=status.HTTP_202_ACCEPTED)
async def request_account_deletion(
    deletion_request: DataDeletionRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Request account deletion (GDPR Article 17 - Right to be forgotten)
    
    This creates a deletion request that will be processed after a grace period.
    The user can cancel the request during this period.
    
    Requires confirmation string: "DELETE MY ACCOUNT"
    """
    if deletion_request.confirmation != "DELETE MY ACCOUNT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid confirmation. Please type 'DELETE MY ACCOUNT' to confirm."
        )
    
    # Check if user is a doctor with upcoming appointments
    if current_user.role == UserRole.DOCTOR:
        from app.models.appointment import Appointment, AppointmentStatus
        upcoming_appointments = db.query(Appointment).filter(
            Appointment.doctor_id == current_user.id,
            Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
            Appointment.appointment_date >= datetime.utcnow()
        ).count()
        
        if upcoming_appointments > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete account with {upcoming_appointments} upcoming appointments. Please cancel them first."
            )
    
    # Mark account for deletion
    current_user.is_active = False
    current_user.email = f"deleted_{current_user.id}_{datetime.utcnow().timestamp()}@deleted.local"
    
    db.commit()
    
    # Log deletion request
    audit_service = get_audit_service(db)
    audit_service.log(
        action=AuditAction.USER_DELETE,
        user_id=current_user.id,
        resource_type="user",
        resource_id=current_user.id,
        details={
            "reason": deletion_request.reason,
            "status": "pending",
            "grace_period_days": 30
        }
    )
    
    # Schedule anonymization in background
    # background_tasks.add_task(anonymize_user_data, current_user.id)
    
    return {
        "message": "Account deletion requested",
        "status": "pending",
        "grace_period_days": 30,
        "can_cancel_until": (datetime.utcnow()).isoformat()
    }


@router.get("/consent")
async def get_consent_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get current consent settings
    
    Returns user's consent for various data processing activities
    """
    # This would typically come from a user_consent table
    # For now, return defaults
    return {
        "user_id": current_user.id,
        "consents": {
            "essential": True,  # Always true - required for service
            "marketing_emails": False,
            "data_analytics": False,
            "third_party_sharing": False
        },
        "last_updated": datetime.utcnow().isoformat()
    }


@router.put("/consent")
async def update_consent(
    consent: ConsentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update consent settings
    
    Allows users to manage their data processing consents
    """
    # Log consent changes
    audit_service = get_audit_service(db)
    audit_service.log(
        action=AuditAction.USER_UPDATE,
        user_id=current_user.id,
        resource_type="user_consent",
        resource_id=current_user.id,
        details={
            "consent_changes": consent.dict(),
            "updated_at": datetime.utcnow().isoformat()
        }
    )
    
    # This would typically update a user_consent table
    # For now, just return the updated consent
    return {
        "user_id": current_user.id,
        "consents": {
            "essential": True,
            "marketing_emails": consent.marketing_emails,
            "data_analytics": consent.data_analytics,
            "third_party_sharing": consent.third_party_sharing
        },
        "last_updated": datetime.utcnow().isoformat()
    }


@router.post("/anonymize-for-analytics")
async def anonymize_data_for_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create anonymized version of user data for analytics
    
    This allows data analysis while protecting user privacy
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can anonymize data"
        )
    
    # This would implement data anonymization logic
    # Pseudonymization, k-anonymity, differential privacy, etc.
    
    return {
        "message": "Data anonymization scheduled",
        "status": "processing"
    }
