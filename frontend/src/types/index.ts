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
}

export enum AppointmentType {
  IN_PERSON = 'in_person',
  VIDEO = 'video',
  HOME_VISIT = 'home_visit',
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
  PRESCRIPTION_READY = 'prescription_ready',
  PAYMENT_RECEIVED = 'payment_received',
  MESSAGE_RECEIVED = 'message_received',
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  profile_picture_url?: string;
  is_active: boolean;
  is_verified: boolean;
  two_factor_enabled: boolean;
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
  notes?: string;
  diagnosis?: string;
  chief_complaint?: string;
  is_video_consultation: boolean;
  video_room_url?: string;
  cancellation_reason?: string;
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
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  family_history?: string;
  immunization_history?: string;
  previous_surgeries?: string;
  lifestyle_notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_expiry_date?: string;
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
  start_date: string;
  end_date?: string;
  instructions?: string;
  status: PrescriptionStatus;
  refills_allowed: number;
  refills_remaining: number;
  auto_renewal_enabled: boolean;
  pharmacy_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_id?: number;
  rating: number;
  comment?: string;
  is_verified_visit: boolean;
  doctor_response?: string;
  is_hidden: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;

  // Relationships
  patient?: User;
}

export interface DoctorSchedule {
  id: number;
  doctor_id: number;
  day_of_week?: number;
  start_time: string;
  end_time: string;
  schedule_type: string;
  is_recurring: boolean;
  specific_date?: string;
  slot_duration_minutes: number;
  break_start_time?: string;
  break_end_time?: string;
  max_appointments?: number;
  location?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  channel: string;
  title: string;
  message: string;
  is_read: boolean;
  reference_id?: number;
  reference_type?: string;
  scheduled_for?: string;
  sent_at?: string;
  created_at: string;
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
  uploaded_by_id: number;
  document_type: string;
  title: string;
  description?: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  is_shared_with_doctors: boolean;
  is_verified: boolean;
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
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  
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
  chief_complaint: string;
  notes?: string;
}

export interface ProfileFormData {
  first_name: string;
  last_name: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  
  // Patient specific
  insurance_provider?: string;
  insurance_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  
  // Doctor specific
  bio?: string;
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
