"""
Pydantic schemas for request/response validation
"""
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserLogin
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordUpdate, MedicalRecordResponse
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate, PrescriptionResponse
from app.schemas.vaccination import VaccinationRecordCreate, VaccinationRecordUpdate, VaccinationRecordResponse
from app.schemas.notification import NotificationCreate, NotificationUpdate, NotificationResponse
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse, PaymentRefund
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse, DoctorResponse, ReviewModeration
from app.schemas.schedule import DoctorScheduleCreate, DoctorScheduleUpdate, DoctorScheduleResponse
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse
from app.schemas.doctor import (
    DoctorPatientSummary,
    DoctorProfileResponse,
    DoctorScheduleOverview,
    AppointmentSlot,
    AppointmentBookingDoctor,
    AppointmentBookingResponse,
)
from app.schemas.health_device import HealthDeviceDataCreate, HealthDeviceDataUpdate, HealthDeviceDataResponse
from app.schemas.waiting_list import WaitingListCreate, WaitingListUpdate, WaitingListResponse
from app.schemas.message import MessageCreate, MessageUpdate, MessageResponse, ConversationResponse

__all__ = [
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserLogin",
    "AppointmentCreate",
    "AppointmentUpdate",
    "AppointmentResponse",
    "MedicalRecordCreate",
    "MedicalRecordUpdate",
    "MedicalRecordResponse",
    "PrescriptionCreate",
    "PrescriptionUpdate",
    "PrescriptionResponse",
    "VaccinationRecordCreate",
    "VaccinationRecordUpdate",
    "VaccinationRecordResponse",
    "NotificationCreate",
    "NotificationUpdate",
    "NotificationResponse",
    "PaymentCreate",
    "PaymentUpdate",
    "PaymentResponse",
    "PaymentRefund",
    "ReviewCreate",
    "ReviewUpdate",
    "ReviewResponse",
    "DoctorResponse",
    "ReviewModeration",
    "DoctorScheduleCreate",
    "DoctorScheduleUpdate",
    "DoctorScheduleResponse",
    "DocumentCreate",
    "DocumentUpdate",
    "DocumentResponse",
    "DoctorPatientSummary",
    "DoctorProfileResponse",
    "DoctorScheduleOverview",
    "AppointmentSlot",
    "AppointmentBookingDoctor",
    "AppointmentBookingResponse",
    "HealthDeviceDataCreate",
    "HealthDeviceDataUpdate",
    "HealthDeviceDataResponse",
    "WaitingListCreate",
    "WaitingListUpdate",
    "WaitingListResponse",
    "MessageCreate",
    "MessageUpdate",
    "MessageResponse",
    "ConversationResponse",
]
