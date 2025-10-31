/**
 * TypeScript type definitions for the Santé Application
 */

export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  ADMIN = 'admin',
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum AppointmentType {
  IN_PERSON = 'in_person',
  VIDEO_CALL = 'video_call',
  PHONE_CALL = 'phone_call',
}

export enum PrescriptionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum NotificationType {
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',
  APPOINTMENT_DELAYED = 'appointment_delayed',
  PRESCRIPTION_READY = 'prescription_ready',
  PRESCRIPTION_RENEWAL = 'prescription_renewal',
  VACCINATION_DUE = 'vaccination_due',
  MESSAGE_RECEIVED = 'message_received',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  DOCUMENT_READY = 'document_ready',
  SYSTEM_ALERT = 'system_alert',
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export enum ScheduleType {
  REGULAR = 'regular',
  EXCEPTION = 'exception',
  HOLIDAY = 'holiday',
  BLOCKED = 'blocked',
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  address_line1?: string;
  address_line2?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  profile_image?: string;
  is_active: boolean;
  is_verified: boolean;
  mfa_enabled?: boolean;
  two_factor_enabled?: boolean;
  created_at: string;
  updated_at: string;

  // Doctor specific fields
  specialization?: string;
  license_number?: string;
  bio?: string;
  consultation_fee?: number;
  rating_average?: number;
  rating_count?: number;
  languages_spoken?: string;
  education?: string;
  accepting_new_patients?: boolean;

  // Patient specific fields
  insurance_provider?: string;
  insurance_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  blood_type?: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  diagnosis?: string;
  prescription?: string;
  video_call_link?: string;
  video_call_room_id?: string;
  reminder_sent?: boolean;
  reminder_sent_at?: string;
  cancelled_by?: number;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;

  // Relationships
  patient?: User;
  doctor?: User;
}

export interface MedicalRecord {
  id: number;
  patient_id: number;
  blood_type?: string;
  height_cm?: number;
  weight_kg?: number;
  allergies?: string[];
  chronic_conditions?: string[];
  current_medications?: string;
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  surgeries?: Array<{
    name: string;
    date: string;
  }>;
  vaccinations?: Array<{
    name: string;
    date: string;
  }>;
  family_history?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  emergency_contact_relationship?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiry_date?: string;
  insurance_valid_until?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id?: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  quantity?: number;
  refills_allowed: number;
  refills_remaining: number;
  instructions?: string;
  notes?: string;
  pharmacy_notes?: string;
  status: PrescriptionStatus;
  prescribed_date: string;
  start_date?: string;
  end_date?: string;
  auto_renewal_enabled: boolean;
  last_renewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id?: number;
  rating: number;
  title?: string;
  review_text?: string;
  verified_visit: boolean;
  doctor_response?: string;
  doctor_response_date?: string;
  is_published: boolean;
  is_flagged: boolean;
  flagged_reason?: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;

  // Relationships
  patient?: User;
}

export interface DoctorSchedule {
  id: number;
  doctor_id: number;
  schedule_type: ScheduleType;
  day_of_week?: DayOfWeek;
  specific_date?: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  buffer_time_minutes?: number;
  max_patients_per_slot?: number;
  location?: string;
  location_address?: string;
  is_available: boolean;
  is_video_consultation: boolean;
  is_active: boolean;
  recurrence_end_date?: string;
  custom_rules?: Record<string, unknown> | null;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface DoctorPatientSummary {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  last_appointment_date?: string;
  next_appointment_date?: string;
}

export interface AppointmentSlot {
  time: string;
  duration: number;
  location?: string | null;
}

export interface AppointmentBookingDoctorSummary {
  id: number;
  first_name: string;
  last_name: string;
  specialization?: string;
  city?: string;
  rating_average?: number;
  rating_count?: number;
  consultation_fee?: number;
}

export interface AppointmentBookingContext {
  doctors: AppointmentBookingDoctorSummary[];
  selected_doctor?: AppointmentBookingDoctorSummary;
  available_slots?: AppointmentSlot[];
}

export interface Notification {
  id: number;
  user_id: number;
  notification_type: NotificationType;
  channel: string;
  title: string;
  message: string;
  status: string;
  reference_id?: number;
  reference_type?: string;
  action_url?: string;
  scheduled_for?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Payment {
  id: number;
  appointment_id: number;
  patient_id: number;
  amount: number;
  currency: string;
  payment_method: string;
  status: PaymentStatus;
  transaction_id?: string;
  invoice_number?: string;
  paid_at?: string;
  refunded_at?: string;
  refund_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  patient_id: number;
  uploaded_by?: number;
  appointment_id?: number;
  document_type: string;
  title: string;
  description?: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  file_size_bytes?: number;
  mime_type?: string;
  is_shared: boolean;
  shared_with?: string;
  ocr_text?: string;
  ocr_processed?: boolean;
  document_date?: string;
  tags?: string;
  verified: boolean;
  verified_by?: number;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  practice_name?: string;
  
  // Doctor specific
  specialization?: string;
  license_number?: string;
  bio?: string;
}

export interface AppointmentFormData {
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  appointment_type: AppointmentType;
  reason: string;
  notes?: string;
}

export interface ProfileFormData {
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  
  // Patient specific
  insurance_provider?: string;
  insurance_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  
  // Doctor specific
  bio?: string;
  experience_years?: number;
  consultation_fee?: number;
  languages_spoken?: string;
  education?: string;
  accepting_new_patients?: boolean;
}

export interface DoctorSearchFilters {
  search?: string;
  specialization?: string;
  city?: string;
  min_rating?: number;
  max_fee?: number;
  accepting_new_patients?: boolean;
  available_date?: string;
}

export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  subject?: string;
  content: string;
  is_read: boolean;
  read_at?: string;
  reference_id?: number;
  reference_type?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface MessageCreate {
  recipient_id: number;
  subject?: string;
  content: string;
  reference_id?: number;
  reference_type?: string;
}

export interface Conversation {
  other_user_id: number;
  other_user_name: string;
  other_user_role: string;
  last_message?: Message;
  unread_count: number;
}
