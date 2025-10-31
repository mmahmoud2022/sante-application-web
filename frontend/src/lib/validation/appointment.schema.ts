/**
 * Appointment Form Validation Schema
 * Matches backend API requirements
 */

import { z } from 'zod';

export const appointmentSchema = z.object({
  doctor_id: z.number().positive('Veuillez sélectionner un médecin'),
  appointment_date: z.string()
    .min(1, 'La date est requise')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  appointment_time: z.string()
    .min(1, 'L\'heure est requise')
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Format d\'heure invalide (HH:MM)'),
  appointment_type: z.enum(['in_person', 'video_call', 'phone_call'], {
    errorMap: () => ({ message: 'Type de rendez-vous invalide' }),
  }),
  reason: z.string()
    .min(10, 'Veuillez fournir plus de détails (minimum 10 caractères)')
    .max(500, 'La raison est trop longue (maximum 500 caractères)'),
  notes: z.string()
    .max(1000, 'Les notes sont trop longues (maximum 1000 caractères)')
    .optional(),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

/**
 * Appointment Update Schema (for rescheduling)
 */
export const appointmentUpdateSchema = z.object({
  appointment_date: z.string()
    .min(1, 'La date est requise')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .optional(),
  appointment_time: z.string()
    .min(1, 'L\'heure est requise')
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Format d\'heure invalide (HH:MM)')
    .optional(),
  notes: z.string()
    .max(1000, 'Les notes sont trop longues (maximum 1000 caractères)')
    .optional(),
});

export type AppointmentUpdateFormData = z.infer<typeof appointmentUpdateSchema>;

/**
 * Appointment Cancellation Schema
 */
export const appointmentCancellationSchema = z.object({
  cancellation_reason: z.string()
    .min(10, 'Veuillez fournir une raison (minimum 10 caractères)')
    .max(500, 'La raison est trop longue (maximum 500 caractères)'),
});

export type AppointmentCancellationFormData = z.infer<typeof appointmentCancellationSchema>;
