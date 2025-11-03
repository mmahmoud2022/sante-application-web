/**
 * Profile Form Validation Schema
 * Matches backend API requirements
 */

import { z } from 'zod';

/**
 * Base Profile Schema (common fields)
 */
export const baseProfileSchema = z.object({
  first_name: z.string()
    .min(1, 'Le prénom est requis')
    .max(50, 'Le prénom est trop long (maximum 50 caractères)'),
  last_name: z.string()
    .min(1, 'Le nom est requis')
    .max(50, 'Le nom est trop long (maximum 50 caractères)'),
  phone: z.string()
    .regex(/^\+?[\d\s\-()]+$/, 'Numéro de téléphone invalide')
    .optional()
    .or(z.literal('')),
  date_of_birth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Genre invalide' }),
  }).optional()
    .or(z.literal('')),
  address_line1: z.string()
    .max(100, 'Adresse trop longue (maximum 100 caractères)')
    .optional()
    .or(z.literal('')),
  address_line2: z.string()
    .max(100, 'Adresse trop longue (maximum 100 caractères)')
    .optional()
    .or(z.literal('')),
  city: z.string()
    .max(50, 'Ville trop longue (maximum 50 caractères)')
    .optional()
    .or(z.literal('')),
  state: z.string()
    .max(50, 'État/Province trop long (maximum 50 caractères)')
    .optional()
    .or(z.literal('')),
  postal_code: z.string()
    .max(20, 'Code postal trop long (maximum 20 caractères)')
    .optional()
    .or(z.literal('')),
  country: z.string()
    .max(50, 'Pays trop long (maximum 50 caractères)')
    .optional()
    .or(z.literal('')),
});

/**
 * Patient Profile Schema
 */
export const patientProfileSchema = baseProfileSchema.extend({
  insurance_provider: z.string()
    .max(100, 'Assureur trop long (maximum 100 caractères)')
    .optional()
    .or(z.literal('')),
  insurance_number: z.string()
    .max(50, 'Numéro d\'assurance trop long (maximum 50 caractères)')
    .optional()
    .or(z.literal('')),
  emergency_contact_name: z.string()
    .max(100, 'Nom du contact d\'urgence trop long (maximum 100 caractères)')
    .optional()
    .or(z.literal('')),
  emergency_contact_phone: z.string()
    .regex(/^\+?[\d\s\-()]+$/, 'Numéro de téléphone invalide')
    .optional()
    .or(z.literal('')),
});

export type PatientProfileFormData = z.infer<typeof patientProfileSchema>;

/**
 * Doctor Profile Schema
 */
export const doctorProfileSchema = baseProfileSchema.extend({
  bio: z.string()
    .max(1000, 'Biographie trop longue (maximum 1000 caractères)')
    .optional()
    .or(z.literal('')),
  experience_years: z.number()
    .min(0, 'L\'expérience ne peut pas être négative')
    .max(70, 'L\'expérience semble trop élevée')
    .optional(),
  consultation_fee: z.number()
    .min(0, 'Les frais ne peuvent pas être négatifs')
    .optional(),
  languages_spoken: z.string()
    .max(200, 'Langues parlées trop longues (maximum 200 caractères)')
    .optional()
    .or(z.literal('')),
  education: z.string()
    .max(500, 'Éducation trop longue (maximum 500 caractères)')
    .optional()
    .or(z.literal('')),
  accepting_new_patients: z.boolean().optional(),
});

export type DoctorProfileFormData = z.infer<typeof doctorProfileSchema>;
