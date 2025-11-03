"""Appointment schemas for request/response validation."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator

from app.models.appointment import AppointmentStatus, AppointmentType
from app.schemas.user import UserResponse

_TYPE_ALIASES: dict[str, AppointmentType] = {
    "in_person": AppointmentType.IN_PERSON,
    "in-person": AppointmentType.IN_PERSON,
    "presential": AppointmentType.IN_PERSON,
    "video": AppointmentType.VIDEO_CALL,
    "video_call": AppointmentType.VIDEO_CALL,
    "video-call": AppointmentType.VIDEO_CALL,
    "telehealth": AppointmentType.VIDEO_CALL,
    "phone": AppointmentType.PHONE_CALL,
    "phone_call": AppointmentType.PHONE_CALL,
    "home_visit": AppointmentType.PHONE_CALL,
    "home-visit": AppointmentType.PHONE_CALL,
}

_TYPE_SERIALIZATION: dict[str, str] = {
    AppointmentType.IN_PERSON.value: "in_person",
    AppointmentType.VIDEO_CALL.value: "video_call",
    AppointmentType.PHONE_CALL.value: "phone_call",
}


def _normalize_appointment_type(value: Any) -> AppointmentType:
    """Normalize incoming appointment type values from the client."""

    if isinstance(value, AppointmentType):
        return value

    if isinstance(value, str):
        normalized = value.strip().lower().replace(" ", "_")
        if normalized in _TYPE_ALIASES:
            return _TYPE_ALIASES[normalized]
        try:
            return AppointmentType(normalized)
        except ValueError as exc:  # pragma: no cover - defensive
            raise ValueError("Invalid appointment type") from exc

    raise ValueError("Invalid appointment type")


class AppointmentBase(BaseModel):
    """Base appointment schema."""

    doctor_id: int
    appointment_date: datetime
    duration_minutes: int = Field(default=30, ge=15, le=180)
    appointment_type: AppointmentType = AppointmentType.IN_PERSON
    reason: Optional[str] = None

    model_config = ConfigDict(extra="ignore")

    @field_validator("appointment_type", mode="before")
    @classmethod
    def _validate_type(cls, value: Any) -> AppointmentType:
        return _normalize_appointment_type(value)

    def model_dump(
        self,
        *,
        mode: Literal["python", "json"] = "python",
        **kwargs: Any,
    ) -> dict[str, Any]:
        data = super().model_dump(mode=mode, **kwargs)

        if mode == "json":
            raw_type = data.get("appointment_type")
            if isinstance(raw_type, AppointmentType):
                raw_type = raw_type.value
            if isinstance(raw_type, str):
                data["appointment_type"] = _TYPE_SERIALIZATION.get(raw_type, raw_type)

        return data


class AppointmentCreate(AppointmentBase):
    """Schema for creating a new appointment."""

    appointment_time: Optional[str] = None
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("appointment_time")
    @classmethod
    def _validate_time(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        try:
            datetime.strptime(value, "%H:%M")
        except ValueError as exc:  # pragma: no cover - defensive
            raise ValueError("appointment_time must be in HH:MM format") from exc
        return value


class AppointmentUpdate(BaseModel):
    """Schema for updating appointment information."""

    appointment_date: Optional[datetime] = None
    appointment_time: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=15, le=180)
    appointment_type: Optional[AppointmentType] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    status: Optional[AppointmentStatus] = None

    model_config = ConfigDict(extra="ignore")

    @field_validator("appointment_time")
    @classmethod
    def _validate_time(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        try:
            datetime.strptime(value, "%H:%M")
        except ValueError as exc:  # pragma: no cover - defensive
            raise ValueError("appointment_time must be in HH:MM format") from exc
        return value

    @field_validator("appointment_type", mode="before")
    @classmethod
    def _validate_type(cls, value: Any) -> Optional[AppointmentType]:
        if value is None:
            return None
        return _normalize_appointment_type(value)


class AppointmentResponse(AppointmentBase):
    """Schema for appointment response."""

    id: int
    patient_id: int
    status: AppointmentStatus
    notes: Optional[str] = None
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    video_call_link: Optional[str] = None
    video_call_room_id: Optional[str] = None
    reminder_sent: bool
    reminder_sent_at: Optional[datetime] = None
    cancelled_by: Optional[int] = None
    cancellation_reason: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    patient: Optional[UserResponse] = None
    doctor: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True, extra="ignore")

    @computed_field
    def appointment_time(self) -> Optional[str]:
        if self.appointment_date is None:
            return None
        return self.appointment_date.strftime("%H:%M")

    @computed_field
    def chief_complaint(self) -> Optional[str]:
        return self.reason


class AppointmentCancelRequest(BaseModel):
    """Payload for cancelling an appointment."""

    reason: Optional[str] = None
