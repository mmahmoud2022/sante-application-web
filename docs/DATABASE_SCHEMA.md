# Database Schema Diagram

This document provides a visual representation of the database schema and model relationships.

## Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            USER MODEL (Central)                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Core Fields: id, email, password, role (PATIENT/DOCTOR/ADMIN)  │    │
│  │ Patient: family_members, managed_by, notification_preferences  │    │
│  │ Doctor: rating, specialization, education, certifications      │    │
│  │ Admin: admin_permissions, last_activity                        │    │
│  │ Security: mfa_enabled, registered_devices                      │    │
│  │ GDPR: data_processing_consent, marketing_consent              │    │
│  └────────────────────────────────────────────────────────────────┘    │
└──────────────────┬──────────────────┬────────────────┬─────────────────┘
                   │                   │                │
         ┌─────────┴──────┐   ┌────────┴─────┐   ┌────┴──────┐
         │                │   │              │   │           │
         ▼                ▼   ▼              ▼   ▼           ▼
   ┌──────────┐    ┌──────────────┐   ┌─────────────┐   ┌──────────┐
   │APPOINTMENT│    │MEDICAL_RECORD│   │NOTIFICATION │   │REVIEW    │
   └─────┬────┘    └──────────────┘   └─────────────┘   └──────────┘
         │
         └─────┬──────────┬──────────┬──────────┬
               │          │          │          │
               ▼          ▼          ▼          ▼
         ┌──────────┐ ┌──────┐ ┌────────┐ ┌─────────┐
         │PRESCRIPTION│PAYMENT│DOCUMENT│SCHEDULE │
         └──────────┘ └──────┘ └────────┘ └─────────┘

Additional Models:
┌─────────────────┐  ┌─────────────────┐
│VACCINATION      │  │HEALTH_DEVICE    │
│RECORD           │  │DATA             │
└─────────────────┘  └─────────────────┘
```

## Detailed Relationships

### User → Appointment (1:N as Patient, 1:N as Doctor)
```
User (Patient)
  └─ appointments_as_patient (FK: patient_id)
     ├─ appointment_date, duration_minutes
     ├─ status: PENDING/CONFIRMED/CANCELLED/COMPLETED
     ├─ type: IN_PERSON/VIDEO_CALL/PHONE_CALL
     ├─ Video: waiting_room, join_times, call_times
     ├─ Reminders: preferences, sent_at
     ├─ Delays: is_delayed, delay_minutes, reason
     └─ Smart: suggested_slots, auto_confirmed

User (Doctor)
  └─ appointments_as_doctor (FK: doctor_id)
     └─ [same structure as above]
```

### User → MedicalRecord (1:N)
```
User (Patient)
  └─ medical_records (FK: patient_id)
     ├─ Metrics: blood_type, height, weight
     ├─ History: allergies, chronic_conditions, medications
     ├─ Family: family_history
     ├─ Emergency: contact_name, phone, relation
     └─ Insurance: provider, policy_number, valid_until
```

### User → Prescription (1:N as Patient, 1:N as Doctor)
```
User (Patient/Doctor)
  └─ prescriptions (FK: patient_id, doctor_id)
     ├─ Medication: name, dosage, frequency, duration
     ├─ Refills: allowed, remaining
     ├─ Status: ACTIVE/COMPLETED/CANCELLED/EXPIRED
     ├─ Dates: prescribed, start, end
     └─ Renewal: auto_enabled, last_renewed_at
```

### User → VaccinationRecord (1:N)
```
User (Patient)
  └─ vaccination_records (FK: patient_id)
     ├─ Vaccine: name, type, manufacturer, lot_number
     ├─ Doses: dose_number, total_doses
     ├─ Administration: date, site, route
     ├─ Next: next_dose_due, reminder_sent
     ├─ Location: facility_name, address
     └─ Verification: verified, document
```

### User → Notification (1:N)
```
User
  └─ notifications (FK: user_id)
     ├─ Type: 13 types (appointment, prescription, payment, etc.)
     ├─ Channel: EMAIL/SMS/PUSH/IN_APP
     ├─ Status: PENDING/SENT/DELIVERED/FAILED/READ
     ├─ Content: title, message
     ├─ Reference: reference_id, reference_type
     ├─ Schedule: scheduled_for, sent_at, delivered_at
     └─ Retry: error_message, retry_count, max_retries
```

### Appointment → Payment (1:N)
```
Appointment
  └─ payments (FK: appointment_id)
     ├─ Amount: amount, currency
     ├─ Method: CREDIT_CARD/PAYPAL/APPLE_PAY/etc.
     ├─ Status: PENDING/COMPLETED/FAILED/REFUNDED
     ├─ Transaction: transaction_id, gateway, response
     ├─ Refund: refunded_amount, reason, refunded_at
     └─ Invoice: invoice_number, invoice_url
```

### User → Review (1:N as Patient, 1:N as Doctor)
```
User (Patient)
  └─ reviews_given (FK: patient_id)
     ├─ Rating: 1.0-5.0 stars
     ├─ Content: title, review_text
     ├─ Verified: verified_visit
     ├─ Response: doctor_response, response_date
     ├─ Moderation: is_published, is_flagged, reason
     └─ Engagement: helpful_count

User (Doctor)
  └─ reviews_received (FK: doctor_id)
     └─ [same structure as above]
```

### User → DoctorSchedule (1:N)
```
User (Doctor)
  └─ schedules (FK: doctor_id)
     ├─ Type: REGULAR/EXCEPTION/HOLIDAY/BLOCKED
     ├─ Regular: day_of_week (MONDAY-SUNDAY)
     ├─ Exception: specific_date
     ├─ Time: start_time, end_time
     ├─ Slots: duration, buffer_time, max_patients
     ├─ Location: location, address
     ├─ Availability: is_available, is_video
     └─ Custom: custom_rules (JSON)
```

### User → Document (1:N as Patient, 1:N as Uploader)
```
User (Patient)
  └─ documents (FK: patient_id)
     ├─ Type: LAB_RESULT/PRESCRIPTION/IMAGE/etc.
     ├─ File: name, path, size, mime_type
     ├─ Access: is_shared, shared_with
     ├─ OCR: ocr_text, ocr_processed
     ├─ Meta: document_date, tags
     └─ Verification: verified, verified_by, verified_at
```

### User → HealthDeviceData (1:N)
```
User (Patient)
  └─ health_device_data (FK: patient_id)
     ├─ Device: type, name, id, manufacturer
     ├─ Measurement: type, date, value, unit
     ├─ Data: additional_data (JSON)
     └─ Sync: synced_at, source_system
```

## Indexes

### Performance Indexes
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Appointments
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Prescriptions
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);

-- Vaccinations
CREATE INDEX idx_vaccinations_patient_id ON vaccination_records(patient_id);
CREATE INDEX idx_vaccinations_date ON vaccination_records(administration_date);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_status ON notifications(status);

-- Payments
CREATE INDEX idx_payments_patient_id ON payments(patient_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);

-- Reviews
CREATE INDEX idx_reviews_patient_id ON reviews(patient_id);
CREATE INDEX idx_reviews_doctor_id ON reviews(doctor_id);

-- Schedules
CREATE INDEX idx_schedules_doctor_id ON doctor_schedules(doctor_id);

-- Documents
CREATE INDEX idx_documents_patient_id ON documents(patient_id);
CREATE INDEX idx_documents_type ON documents(document_type);

-- Health Device Data
CREATE INDEX idx_health_data_patient_id ON health_device_data(patient_id);
CREATE INDEX idx_health_data_type ON health_device_data(measurement_type);
CREATE INDEX idx_health_data_date ON health_device_data(measurement_date);
```

## Cascade Rules

### ON DELETE Behaviors
```
User (Patient) deleted:
  ├─ Appointments: RESTRICT (cannot delete if has appointments)
  ├─ Medical Records: CASCADE (delete patient records)
  ├─ Prescriptions: RESTRICT (cannot delete if has active prescriptions)
  ├─ Vaccinations: CASCADE (delete vaccination records)
  ├─ Notifications: CASCADE (delete notifications)
  ├─ Payments: RESTRICT (cannot delete if has payments)
  ├─ Reviews: CASCADE (delete reviews)
  ├─ Documents: CASCADE (delete documents)
  └─ Health Data: CASCADE (delete health data)

User (Doctor) deleted:
  ├─ Appointments: RESTRICT (cannot delete if has appointments)
  ├─ Prescriptions: RESTRICT (cannot delete if has prescriptions)
  ├─ Reviews: SET NULL (keep reviews, anonymize doctor)
  └─ Schedules: CASCADE (delete schedules)

Appointment deleted:
  ├─ Payments: SET NULL (keep payment, remove appointment link)
  ├─ Prescriptions: SET NULL (keep prescription, remove appointment link)
  └─ Reviews: SET NULL (keep review, remove appointment link)
```

## Field Types Summary

### Text Fields
- `String(50)` - Short identifiers (license_number, phone)
- `String(100)` - Names, titles
- `String(200)` - Longer names, descriptions
- `String(500)` - URLs, file paths
- `Text` - Unlimited text (notes, descriptions, JSON)

### Numeric Fields
- `Integer` - IDs, counts, durations
- `Float` - Ratings, measurements
- `Numeric(10,2)` - Money amounts (precise decimal)

### Date/Time Fields
- `DateTime(timezone=True)` - All timestamps (timezone-aware)
- `Time` - Time of day (schedules)

### Boolean Fields
- Default values set appropriately
- Used for flags and status indicators

### JSON Fields
- `Text` type storing JSON strings
- Flexible for complex data structures
- Used for: preferences, rules, lists

## Enumerations

### User Enums
- `UserRole`: PATIENT, DOCTOR, ADMIN

### Appointment Enums
- `AppointmentStatus`: PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
- `AppointmentType`: IN_PERSON, VIDEO_CALL, PHONE_CALL

### Prescription Enums
- `PrescriptionStatus`: ACTIVE, COMPLETED, CANCELLED, EXPIRED

### Notification Enums
- `NotificationType`: 13 types (appointment, prescription, payment, etc.)
- `NotificationChannel`: EMAIL, SMS, PUSH, IN_APP
- `NotificationStatus`: PENDING, SENT, DELIVERED, FAILED, READ

### Payment Enums
- `PaymentMethod`: CREDIT_CARD, DEBIT_CARD, PAYPAL, APPLE_PAY, GOOGLE_PAY, etc.
- `PaymentStatus`: PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, etc.

### Schedule Enums
- `DayOfWeek`: MONDAY, TUESDAY, ..., SUNDAY
- `ScheduleType`: REGULAR, EXCEPTION, HOLIDAY, BLOCKED

### Document Enums
- `DocumentType`: LAB_RESULT, PRESCRIPTION, MEDICAL_IMAGE, etc.

### Device Enums
- `DeviceType`: FITNESS_TRACKER, SMARTWATCH, monitors, etc.
- `MeasurementType`: HEART_RATE, BLOOD_PRESSURE, etc.

---

**Note**: This schema supports all 41 features specified in the requirements with full referential integrity and proper normalization.

**Last Updated**: October 19, 2025  
**Schema Version**: 1.0.0
