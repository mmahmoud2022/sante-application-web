"""
Main API router that includes all endpoint routers
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    appointments,
    medical_records,
    prescriptions,
    reviews,
    schedules,
    notifications,
    doctor,
    patient,
    documents,
    waiting_lists,
    messages,
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
api_router.include_router(medical_records.router, prefix="/medical-records", tags=["Medical Records"])
api_router.include_router(prescriptions.router, prefix="/prescriptions", tags=["Prescriptions"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
api_router.include_router(schedules.router, prefix="/schedules", tags=["Schedules"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(messages.router, prefix="/messages", tags=["Messages"])
api_router.include_router(doctor.router, prefix="/doctor", tags=["Doctor"])
api_router.include_router(patient.router, prefix="/patient", tags=["Patient"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(waiting_lists.router, prefix="/waiting-lists", tags=["Waiting Lists"])
