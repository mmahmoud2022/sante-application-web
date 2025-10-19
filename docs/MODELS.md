# Data Models Documentation

This document describes all the data models in the Santé Medical Application backend, organized by feature category.

## Table of Contents

1. [User Management](#user-management)
2. [Appointments](#appointments)
3. [Medical Records](#medical-records)
4. [Prescriptions](#prescriptions)
5. [Vaccinations](#vaccinations)
6. [Notifications](#notifications)
7. [Payments](#payments)
8. [Reviews](#reviews)
9. [Doctor Scheduling](#doctor-scheduling)
10. [Documents](#documents)
11. [Health Devices](#health-devices)

---

## User Management

### User Model

The `User` model represents all user types in the system: patients, doctors, and administrators.

**Core Fields:**
- `id`: Primary key
- `email`: Unique email address for authentication
- `hashed_password`: Securely hashed password
- `first_name`, `last_name`: User's name
- `phone`: Contact phone number
- `date_of_birth`: Birth date
- `role`: User role (PATIENT, DOCTOR, ADMIN)
- `is_active`, `is_verified`: Account status flags

**Security & Authentication:**
- `mfa_enabled`, `mfa_secret`: Multi-factor authentication support
- `registered_devices`: JSON array of registered device IDs for security tracking
- `last_login`: Last login timestamp

**Patient-Specific Features:**
- `notification_preferences`: JSON object for email/SMS/push preferences
- `family_members`: JSON array of family member IDs
- `managed_by`: For dependents managed by another user
- `data_processing_consent`, `marketing_consent`: GDPR compliance
- `terms_accepted_at`: Terms acceptance timestamp

**Doctor-Specific Fields:**
- `specialization`: Medical specialization
- `license_number`: Professional license number
- `bio`: Professional biography
- `experience_years`: Years of experience
- `consultation_fee`: Fee in cents
- `rating_average`, `rating_count`: Aggregated ratings
- `languages_spoken`: Comma-separated language list
- `education`: Educational background
- `certifications`: JSON array of certifications
- `professional_memberships`: Professional organizations
- `accepting_new_patients`: Availability flag

**Admin-Specific Fields:**
- `admin_permissions`: JSON object with granular permissions
- `last_activity`: Last administrative activity timestamp

**Location Information:**
- `address_line1`, `address_line2`: Street address
- `city`, `state`, `postal_code`, `country`: Geographic location

**Other Fields:**
- `profile_image`: Profile photo URL
- `suspended`, `suspension_reason`: Account suspension status

**Supported Features:**
- Two-step verification for all roles
- Family mode for patient dependents
- Device synchronization tracking
- Granular notification preferences
- Professional credentials for doctors
- GDPR compliance for data privacy

---

## Appointments

### Appointment Model

Manages medical appointments between patients and doctors.

**Core Fields:**
- `id`: Primary key
- `patient_id`, `doctor_id`: Foreign keys to User
- `appointment_date`: Scheduled date and time
- `duration_minutes`: Expected duration (default: 30 minutes)
- `appointment_type`: IN_PERSON, VIDEO_CALL, or PHONE_CALL
- `status`: PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW

**Appointment Details:**
- `reason`: Reason for appointment
- `notes`: Additional notes
- `diagnosis`: Doctor's diagnosis (after appointment)
- `prescription`: Prescription details (deprecated - use Prescription model)

**Video Consultation:**
- `video_call_link`: URL for video call
- `video_call_room_id`: Room identifier
- `waiting_room_enabled`: Virtual waiting room flag
- `patient_joined_at`, `doctor_joined_at`: Join timestamps
- `call_started_at`, `call_ended_at`: Call timing

**Reminders & Notifications:**
- `reminder_sent`, `reminder_sent_at`: Reminder tracking
- `reminder_preferences`: JSON for multi-channel preferences
- `confirmation_sent`: Confirmation email status

**Delay Management:**
- `is_delayed`: Delay indicator
- `delay_minutes`: Duration of delay
- `delay_reason`: Explanation for delay
- `delay_notified`: Patient notification status

**Smart Scheduling:**
- `suggested_time_slots`: JSON array of AI-suggested times
- `auto_confirmed`: Auto-confirmation flag

**Follow-up:**
- `follow_up_required`: Flag for follow-up needed
- `follow_up_date`: Scheduled follow-up date

**Cancellation:**
- `cancelled_by`: User who cancelled
- `cancellation_reason`: Reason for cancellation
- `cancelled_at`: Cancellation timestamp
- `replacement_suggested`: Replacement appointment offered
- `replacement_appointment_id`: Link to replacement

**Supported Features:**
- Integrated video teleconsultations with virtual waiting room
- Multi-channel customizable reminders
- Real-time notifications for delays or changes
- Intelligent appointment booking with time slot suggestions
- Automated cancellation management with replacement suggestions

---

## Medical Records

### MedicalRecord Model

Stores comprehensive patient medical information.

**Core Fields:**
- `id`: Primary key
- `patient_id`: Foreign key to User

**Basic Health Metrics:**
- `blood_type`: Blood type
- `height_cm`, `weight_kg`: Physical measurements

**Medical History (JSON fields):**
- `allergies`: List of allergies
- `chronic_conditions`: List of chronic conditions
- `medications`: Current medications
- `surgeries`: Past surgeries
- `vaccinations`: Vaccination history (legacy - use VaccinationRecord model)

**Family & Emergency:**
- `family_history`: Family medical history text
- `emergency_contact_name`, `emergency_contact_phone`: Emergency contact
- `emergency_contact_relation`: Relationship to patient

**Insurance:**
- `insurance_provider`: Insurance company name
- `insurance_policy_number`: Policy number
- `insurance_valid_until`: Policy expiration date

**Additional:**
- `notes`: Additional medical notes

**Supported Features:**
- Personal medical record with history, allergies, and current treatments
- Complete consultation history and medical documents
- Family mode support for dependents

---

## Prescriptions

### Prescription Model

Manages patient prescriptions with renewal tracking.

**Core Fields:**
- `id`: Primary key
- `patient_id`, `doctor_id`: Foreign keys to User
- `appointment_id`: Related appointment (optional)

**Medication Details:**
- `medication_name`: Name of medication
- `dosage`: Dosage information
- `frequency`: How often to take
- `duration_days`: Treatment duration
- `quantity`: Number of units
- `refills_allowed`, `refills_remaining`: Refill management
- `instructions`: Special instructions
- `notes`: Additional notes

**Status:**
- `status`: ACTIVE, COMPLETED, CANCELLED, EXPIRED

**Dates:**
- `prescribed_date`: When prescribed
- `start_date`, `end_date`: Treatment period

**Renewal:**
- `auto_renewal_enabled`: Automatic renewal flag
- `last_renewed_at`: Last renewal timestamp

**Supported Features:**
- Prescription tracking and automatic renewals
- Electronic prescription system with drug database
- Prescription management with status tracking

---

## Vaccinations

### VaccinationRecord Model

Tracks patient vaccination history with reminder support.

**Core Fields:**
- `id`: Primary key
- `patient_id`: Foreign key to User
- `administered_by`: Doctor who administered (optional)

**Vaccine Details:**
- `vaccine_name`: Name of vaccine
- `vaccine_type`: Type/category
- `manufacturer`: Vaccine manufacturer
- `lot_number`: Batch/lot number
- `dose_number`, `total_doses`: Dose sequence

**Administration:**
- `administration_date`: When administered
- `administration_site`: Body location
- `route`: Administration method

**Reminders:**
- `next_dose_due`: Next dose date
- `reminder_sent`: Reminder notification status

**Location:**
- `facility_name`, `facility_address`: Where administered

**Safety:**
- `notes`: General notes
- `adverse_reactions`: Any reactions experienced

**Verification:**
- `verified`: Verification status
- `verification_document`: Document URL

**Supported Features:**
- Digital vaccination record with reminder alerts
- Vaccination tracking with verification
- Multi-dose vaccine management

---

## Notifications

### Notification Model

Multi-channel notification system with scheduling and retry logic.

**Core Fields:**
- `id`: Primary key
- `user_id`: Recipient user

**Notification Type:**
- `notification_type`: Type of notification (see NotificationType enum)
  - APPOINTMENT_REMINDER, APPOINTMENT_CONFIRMED, APPOINTMENT_CANCELLED
  - APPOINTMENT_RESCHEDULED, APPOINTMENT_DELAYED
  - PRESCRIPTION_READY, PRESCRIPTION_RENEWAL
  - VACCINATION_DUE
  - MESSAGE_RECEIVED
  - PAYMENT_RECEIVED, PAYMENT_FAILED
  - DOCUMENT_READY
  - SYSTEM_ALERT

**Delivery:**
- `channel`: EMAIL, SMS, PUSH, or IN_APP
- `status`: PENDING, SENT, DELIVERED, FAILED, READ

**Content:**
- `title`: Notification title
- `message`: Notification message

**Metadata:**
- `reference_id`, `reference_type`: Link to related entity
- `action_url`: Action link

**Scheduling:**
- `scheduled_for`: When to send
- `sent_at`, `delivered_at`, `read_at`: Tracking timestamps

**Error Handling:**
- `error_message`: Error details if failed
- `retry_count`, `max_retries`: Retry logic

**Supported Features:**
- Multi-channel customizable reminders (email, SMS, push)
- Real-time notifications for delays or changes
- Scheduled notifications with retry logic
- In-app notification center

---

## Payments

### Payment Model

Manages financial transactions with multiple payment methods.

**Core Fields:**
- `id`: Primary key
- `patient_id`, `doctor_id`: Transaction parties
- `appointment_id`: Related appointment (optional)

**Payment Details:**
- `amount`: Payment amount (Decimal)
- `currency`: Currency code (default: EUR)
- `payment_method`: Payment method (see PaymentMethod enum)
  - CREDIT_CARD, DEBIT_CARD
  - PAYPAL, APPLE_PAY, GOOGLE_PAY
  - BANK_TRANSFER, CASH, INSURANCE
- `status`: Payment status (see PaymentStatus enum)
  - PENDING, PROCESSING, COMPLETED, FAILED
  - REFUNDED, PARTIALLY_REFUNDED, CANCELLED

**Transaction:**
- `transaction_id`: Unique transaction identifier
- `payment_gateway`: Gateway used (Stripe, PayPal, etc.)
- `gateway_response`: Raw gateway response

**Refunds:**
- `refunded_amount`: Amount refunded
- `refund_reason`: Reason for refund
- `refunded_at`: Refund timestamp

**Invoicing:**
- `invoice_number`: Invoice number
- `invoice_url`: Invoice PDF URL

**Description:**
- `description`: Payment description
- `notes`: Additional notes

**Dates:**
- `payment_date`: When payment completed

**Supported Features:**
- Secure online payment (Credit Card, PayPal, Apple Pay)
- Refund management
- Invoice generation
- Multiple payment methods
- Integrated billing module with teletransmission

---

## Reviews

### Review Model

Doctor rating and review system with moderation.

**Core Fields:**
- `id`: Primary key
- `patient_id`: Reviewer
- `doctor_id`: Doctor being reviewed
- `appointment_id`: Related appointment (optional)

**Rating:**
- `rating`: Star rating (1.0 to 5.0)
- `title`: Review title
- `review_text`: Review content

**Verification:**
- `verified_visit`: Verified appointment flag

**Doctor Response:**
- `doctor_response`: Doctor's response text
- `doctor_response_date`: Response timestamp

**Moderation:**
- `is_published`: Publication status
- `is_flagged`: Flag for inappropriate content
- `flagged_reason`: Reason for flagging
- `moderated_by`: Moderator user ID
- `moderated_at`: Moderation timestamp

**Engagement:**
- `helpful_count`: Number of helpful votes

**Supported Features:**
- Practitioner rating system
- Review moderation and management
- Doctor response capability
- Verified reviews from actual appointments

---

## Doctor Scheduling

### DoctorSchedule Model

Flexible doctor availability scheduling system.

**Core Fields:**
- `id`: Primary key
- `doctor_id`: Foreign key to User

**Schedule Type:**
- `schedule_type`: REGULAR, EXCEPTION, HOLIDAY, or BLOCKED

**Time Configuration:**
- For regular schedules:
  - `day_of_week`: MONDAY through SUNDAY
- For exception schedules:
  - `specific_date`: Specific date

**Time Slots:**
- `start_time`, `end_time`: Time range
- `slot_duration_minutes`: Duration per slot (default: 30)
- `buffer_time_minutes`: Buffer between appointments
- `max_patients_per_slot`: Concurrent patient limit

**Location:**
- `location`: Location name
- `location_address`: Full address

**Availability:**
- `is_available`: Availability toggle
- `is_video_consultation`: Video consultation flag

**Recurrence:**
- `recurrence_end_date`: When regular schedule ends

**Customization:**
- `custom_rules`: JSON for complex scheduling rules
- `notes`: Additional notes

**Supported Features:**
- Advanced calendar configuration with customizable rules
- Recurring schedules
- Holiday management
- Multi-location support
- Video consultation scheduling

---

## Documents

### Document Model

Medical document management with OCR and sharing.

**Core Fields:**
- `id`: Primary key
- `patient_id`: Document owner
- `uploaded_by`: Uploader user ID
- `appointment_id`: Related appointment (optional)

**Document Type:**
- `document_type`: Type of document (see DocumentType enum)
  - LAB_RESULT, PRESCRIPTION, MEDICAL_IMAGE
  - REPORT, INVOICE, CONSENT_FORM
  - INSURANCE_DOCUMENT, VACCINATION_CERTIFICATE
  - MEDICAL_CERTIFICATE, OTHER

**Metadata:**
- `title`: Document title
- `description`: Description

**File Information:**
- `file_name`: Original filename
- `file_path`: Storage path
- `file_size_bytes`: File size
- `mime_type`: MIME type

**Access Control:**
- `is_shared`: Sharing flag
- `shared_with`: Comma-separated user IDs

**OCR Processing:**
- `ocr_text`: Extracted text
- `ocr_processed`: Processing status

**Additional Metadata:**
- `document_date`: Document date
- `tags`: Comma-separated tags

**Verification:**
- `verified`: Verification status
- `verified_by`: Verifier user ID
- `verified_at`: Verification timestamp

**Supported Features:**
- Complete consultation history and medical documents
- Document sharing between patient and doctors
- OCR for scanned documents
- Document verification system

---

## Health Devices

### HealthDeviceData Model

Connected health device data synchronization.

**Core Fields:**
- `id`: Primary key
- `patient_id`: Foreign key to User

**Device Information:**
- `device_type`: Type of device (see DeviceType enum)
  - FITNESS_TRACKER, SMARTWATCH
  - BLOOD_PRESSURE_MONITOR, GLUCOSE_MONITOR
  - HEART_RATE_MONITOR, WEIGHT_SCALE
  - THERMOMETER, PULSE_OXIMETER, OTHER
- `device_name`: Device name
- `device_id`: Device identifier
- `manufacturer`: Device manufacturer

**Measurement:**
- `measurement_type`: Type of measurement (see MeasurementType enum)
  - HEART_RATE, BLOOD_PRESSURE, BLOOD_GLUCOSE
  - WEIGHT, TEMPERATURE, OXYGEN_SATURATION
  - STEPS, CALORIES, SLEEP, OTHER
- `measurement_date`: When measured

**Values:**
- `value`: Numeric value
- `value_unit`: Unit of measurement
- `additional_data`: JSON for complex data

**Metadata:**
- `notes`: Additional notes

**Synchronization:**
- `synced_at`: Synchronization timestamp
- `source_system`: Source system name

**Supported Features:**
- Synchronization with connected health devices
- Multiple device type support
- Flexible measurement storage
- Health tracking and monitoring

---

## Enum Reference

### UserRole
- `PATIENT`: Patient user
- `DOCTOR`: Medical doctor
- `ADMIN`: System administrator

### AppointmentStatus
- `PENDING`: Awaiting confirmation
- `CONFIRMED`: Confirmed appointment
- `CANCELLED`: Cancelled appointment
- `COMPLETED`: Completed appointment
- `NO_SHOW`: Patient did not show up

### AppointmentType
- `IN_PERSON`: In-person consultation
- `VIDEO_CALL`: Video consultation
- `PHONE_CALL`: Phone consultation

### PrescriptionStatus
- `ACTIVE`: Currently active
- `COMPLETED`: Treatment completed
- `CANCELLED`: Cancelled prescription
- `EXPIRED`: Expired prescription

### NotificationChannel
- `EMAIL`: Email notification
- `SMS`: SMS notification
- `PUSH`: Push notification
- `IN_APP`: In-app notification

### PaymentMethod
- `CREDIT_CARD`, `DEBIT_CARD`
- `PAYPAL`, `APPLE_PAY`, `GOOGLE_PAY`
- `BANK_TRANSFER`, `CASH`, `INSURANCE`

### DayOfWeek
- `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`

### ScheduleType
- `REGULAR`: Regular recurring schedule
- `EXCEPTION`: Exception to regular schedule
- `HOLIDAY`: Holiday/closed
- `BLOCKED`: Blocked time slot

---

## Database Relationships

### User Relationships
- **appointments_as_patient**: Appointments where user is the patient
- **appointments_as_doctor**: Appointments where user is the doctor
- **medical_records**: User's medical records
- **notifications**: User's notifications

### Appointment Relationships
- **patient**: Patient user
- **doctor**: Doctor user

### MedicalRecord Relationships
- **patient**: Patient user

### Prescription Relationships
- **patient**: Patient user
- **doctor**: Prescribing doctor

### VaccinationRecord Relationships
- **patient**: Patient user
- **administrator**: Administering healthcare provider

### Notification Relationships
- **user**: Recipient user

### Payment Relationships
- **patient**: Paying patient
- **doctor**: Doctor receiving payment
- **appointment**: Related appointment

### Review Relationships
- **patient**: Reviewing patient
- **doctor**: Doctor being reviewed
- **appointment**: Related appointment

### DoctorSchedule Relationships
- **doctor**: Doctor user

### Document Relationships
- **patient**: Document owner
- **uploader**: User who uploaded
- **appointment**: Related appointment

### HealthDeviceData Relationships
- **patient**: Patient user

---

## Migration Notes

When deploying these models, create an Alembic migration that:

1. Adds new columns to the `users` table
2. Adds new columns to the `appointments` table
3. Creates new tables for all new models
4. Sets up appropriate foreign key constraints
5. Creates necessary indexes for performance
6. Handles default values properly

Example migration command:
```bash
alembic revision --autogenerate -m "Add comprehensive feature support models"
alembic upgrade head
```

---

## Usage Examples

### Creating a Prescription
```python
prescription = Prescription(
    patient_id=patient.id,
    doctor_id=doctor.id,
    medication_name="Amoxicillin",
    dosage="500mg",
    frequency="3 times daily",
    duration_days=7,
    instructions="Take with food"
)
```

### Scheduling a Video Consultation
```python
appointment = Appointment(
    patient_id=patient.id,
    doctor_id=doctor.id,
    appointment_date=datetime.now() + timedelta(days=1),
    appointment_type=AppointmentType.VIDEO_CALL,
    waiting_room_enabled=True,
    reminder_preferences='{"email": true, "sms": true}'
)
```

### Recording Health Device Data
```python
heart_rate_data = HealthDeviceData(
    patient_id=patient.id,
    device_type=DeviceType.FITNESS_TRACKER,
    measurement_type=MeasurementType.HEART_RATE,
    measurement_date=datetime.now(),
    value=72.0,
    value_unit="bpm"
)
```

---

**Last Updated:** October 19, 2025  
**Version:** 1.0.0
