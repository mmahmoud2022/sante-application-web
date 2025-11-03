# Appointment Booking System - Implementation Documentation

## Overview

This document describes the enhanced appointment booking system that implements the requirements from the problem statement. The system provides comprehensive functionality for patients and doctors to manage medical appointments with advanced features.

## Key Features Implemented

### 1. Enhanced Practitioner Search

**Location:** `backend/app/api/v1/endpoints/patient.py`

Patients can now search for practitioners using multiple criteria:

- **Specialty**: Filter doctors by specialization (e.g., dermatologist, dentist, general practitioner)
- **Location**: Search by city or postal code
- **Distance**: Filter doctors within a certain distance (via city/postal code)
- **Reason for consultation**: Store the reason with the appointment (e.g., "Follow-up consultation," "First consultation," "Emergency")

**API Endpoints:**
- `GET /api/v1/patient/book-appointment` - Enhanced with specialty, city, postal_code, and reason parameters
- `GET /api/v1/patient/search-doctors` - Advanced search with all filters

**Example Usage:**
```bash
# Search for dermatologists in Paris
GET /api/v1/patient/search-doctors?specialty=dermatologist&city=Paris

# Search with minimum rating
GET /api/v1/patient/search-doctors?specialty=dentist&city=Lyon&min_rating=4.0
```

### 2. Real-Time Slot Booking (First-Come-First-Served)

**Location:** `backend/app/services/appointment_service.py`

The system implements real-time slot availability checking to prevent double-bookings:

- **Function:** `check_slot_availability()`
- Checks for overlapping appointments in real-time
- Uses database-level constraints to ensure consistency
- Only considers active appointments (PENDING, CONFIRMED)
- Cancelled appointments don't block slots

**How It Works:**
1. When a patient tries to book a slot, the system checks for conflicts
2. If two patients try to book the same slot simultaneously, only the first succeeds
3. The second patient receives an error message: "This time slot is already booked"
4. The system automatically blocks the slot once booked

### 3. Waiting List Feature

**Location:** 
- Model: `backend/app/models/waiting_list.py`
- API: `backend/app/api/v1/endpoints/waiting_lists.py`
- Schema: `backend/app/schemas/waiting_list.py`

Practitioners can activate a waiting list option to offer earlier slots when appointments are cancelled:

**API Endpoints:**
- `POST /api/v1/waiting-lists/` - Join a waiting list for a doctor
- `GET /api/v1/waiting-lists/` - List waiting list entries
- `PUT /api/v1/waiting-lists/{id}` - Update waiting list preferences
- `DELETE /api/v1/waiting-lists/{id}` - Leave the waiting list

**Example Usage:**
```json
POST /api/v1/waiting-lists/
{
  "doctor_id": 7,
  "preferred_date_start": "2025-10-22T00:00:00Z",
  "preferred_date_end": "2025-10-30T00:00:00Z",
  "preferred_time_slots": "[\"09:00-12:00\", \"14:00-17:00\"]",
  "appointment_reason": "Follow-up consultation"
}
```

### 4. Teleconsultation Verification

**Location:** `backend/app/services/appointment_service.py`

Before a teleconsultation, the system verifies:
- Connection setup (video call link exists)
- Access rights (patient/doctor only)
- Time window (can join 15 minutes before, session closes after duration)

**API Endpoint:**
- `GET /api/v1/appointments/{id}/teleconsultation-status` - Check if teleconsultation is ready

**Response:**
```json
{
  "ready": true,
  "message": "Teleconsultation is ready",
  "video_call_link": "https://meet.example.com/room123",
  "waiting_room_enabled": true
}
```

### 5. Cancellation Policy (24-Hour Rule)

**Location:** `backend/app/services/appointment_service.py`

The system enforces a cancellation policy:

- **Function:** `can_cancel_appointment()`
- Default policy: Must cancel at least 24 hours before appointment
- Doctors and admins can override this policy
- Already cancelled or completed appointments cannot be cancelled

**Updated Endpoint:**
- `PATCH /api/v1/appointments/{id}/cancel` - Cancel with policy validation

### 6. Appointment Type Configuration

**Location:** `backend/app/models/schedule.py`

Doctors can configure:
- Types of appointments they accept (in-person, teleconsultation, phone)
- Duration per appointment type:
  - Follow-up consultation: 15 minutes
  - Initial consultation: 30 minutes
  - Emergency: 45 minutes

**Configuration stored in `custom_rules` JSON field:**
```json
{
  "minimum_booking_hours": 2,
  "accepted_appointment_types": ["in_person", "video_call"],
  "follow_up_duration": 15,
  "initial_consultation_duration": 30,
  "emergency_duration": 45
}
```

### 7. Minimum Booking Time Restrictions

**Location:** `backend/app/services/appointment_service.py`

Prevents same-day bookings when doctors require advance notice:

- **Function:** `validate_booking_time()`
- Configurable per doctor in schedule settings
- Default: 2 hours minimum advance booking
- Example: "No same-day appointments" = 24 hours minimum

## Database Changes

### New Table: `waiting_lists`

**Migration:** `backend/alembic/versions/001_add_waiting_list.py`

**Schema:**
```sql
CREATE TABLE waiting_lists (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES users(id),
    doctor_id INTEGER NOT NULL REFERENCES users(id),
    preferred_date_start TIMESTAMP WITH TIME ZONE,
    preferred_date_end TIMESTAMP WITH TIME ZONE,
    preferred_time_slots VARCHAR(500),
    appointment_reason VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notified BOOLEAN NOT NULL DEFAULT FALSE,
    notified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### Enhanced Table: `doctor_schedules`

Added `custom_rules` JSON field to support:
- Minimum booking hours
- Accepted appointment types
- Duration per appointment type

## Testing

**Location:** `backend/tests/test_appointment_service.py`

Comprehensive test suite covering:

1. **Slot Availability Tests:**
   - Available with no conflicts
   - Unavailable for past dates
   - Unavailable with conflicts
   - Available for cancelled appointments

2. **Booking Time Validation Tests:**
   - Valid with sufficient advance time
   - Invalid when too soon

3. **Appointment Type Validation Tests:**
   - Video consultations accepted/rejected based on doctor settings
   - In-person always accepted

4. **Cancellation Policy Tests:**
   - Can cancel with sufficient time
   - Cannot cancel too late
   - Cannot cancel already cancelled appointments

5. **Teleconsultation Verification Tests:**
   - Ready when all conditions met
   - Not ready too early
   - Not ready without video link
   - In-person appointments bypass verification

**Run Tests:**
```bash
cd backend
pytest tests/test_appointment_service.py -v
```

## API Documentation

All endpoints are documented in Swagger UI:
- URL: `http://localhost:8000/docs`
- Tags: 
  - "Appointments" - Appointment management
  - "Waiting Lists" - Waiting list management
  - "Patient" - Patient-specific endpoints

## Integration Points

### Notification System

The appointment service integrates with the notification system for:
- Appointment confirmation (email/SMS)
- Appointment reminders
- Cancellation notifications
- Waiting list notifications (when slots become available)

### Calendar Synchronization

The system supports:
- Standalone calendar
- Integration with external medical software (e.g., Hellodoc, WEDA)
- Real-time slot blocking across all systems

## Security Considerations

1. **Authorization:** All endpoints verify user permissions
2. **Validation:** Input validation prevents invalid bookings
3. **Race Conditions:** Database transactions prevent double-bookings
4. **Data Privacy:** Patient data is protected per GDPR requirements

## Future Enhancements

1. **Queue Management:** Priority queue for urgent appointments
2. **Distance Calculation:** Actual distance calculation using geocoding API
3. **Smart Scheduling:** AI-based slot recommendations
4. **Payment Integration:** Upfront payment for certain appointment types
5. **Review System:** Post-appointment rating and feedback
6. **Analytics:** Booking patterns and optimization

## Migration Guide

To apply the database changes:

```bash
cd backend
alembic upgrade head
```

This will create the `waiting_lists` table and any other pending migrations.

## Troubleshooting

### Common Issues

1. **"Slot already booked" error:**
   - Another patient booked the slot first
   - Solution: Refresh available slots and choose another time

2. **"Minimum booking time" error:**
   - Trying to book too close to appointment time
   - Solution: Choose a slot further in the future

3. **"Doctor does not accept video consultations" error:**
   - Doctor hasn't configured video consultation schedule
   - Solution: Choose in-person appointment or different doctor

4. **Teleconsultation link not working:**
   - Check appointment status endpoint
   - Ensure you're within the 15-minute join window

## Support

For issues or questions:
- Check API documentation: `/docs`
- Review test cases: `backend/tests/test_appointment_service.py`
- Contact: support@sante-app.com
