/**
 * Authentication Form Validation Schema
 * Matches backend API requirements
 */

import { z } from 'zod';

/**
 * Login Schema
 */
export const loginSchema = z.object({
  email: z.string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z.string()
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  remember_me: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Register Schema
 */
export const registerSchema = z.object({
  email: z.string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe est trop long (maximum 100 caractères)')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
    ),
  confirm_password: z.string()
    .min(1, 'La confirmation du mot de passe est requise'),
  first_name: z.string()
    .min(1, 'Le prénom est requis')
    .max(50, 'Le prénom est trop long (maximum 50 caractères)'),
  last_name: z.string()
    .min(1, 'Le nom est requis')
    .max(50, 'Le nom est trop long (maximum 50 caractères)'),
  role: z.enum(['patient', 'doctor'], {
    errorMap: () => ({ message: 'Rôle invalide' }),
  }),
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
  // Doctor specific
  specialization: z.string()
    .max(100, 'Spécialisation trop longue (maximum 100 caractères)')
    .optional()
    .or(z.literal('')),
  license_number: z.string()
    .max(50, 'Numéro de licence trop long (maximum 50 caractères)')
    .optional()
    .or(z.literal('')),
  bio: z.string()
    .max(1000, 'Biographie trop longue (maximum 1000 caractères)')
    .optional()
    .or(z.literal('')),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Password Reset Request Schema
 */
export const passwordResetRequestSchema = z.object({
  email: z.string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
});

export type PasswordResetRequestFormData = z.infer<typeof passwordResetRequestSchema>;

/**
 * Password Reset Schema
 */
export const passwordResetSchema = z.object({
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe est trop long (maximum 100 caractères)')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
    ),
  confirm_password: z.string()
    .min(1, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
});

export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

/**
 * Change Password Schema
 */
export const changePasswordSchema = z.object({
  current_password: z.string()
    .min(1, 'Le mot de passe actuel est requis'),
  new_password: z.string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe est trop long (maximum 100 caractères)')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
    ),
  confirm_password: z.string()
    .min(1, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
}).refine((data) => data.current_password !== data.new_password, {
  message: 'Le nouveau mot de passe doit être différent de l\'ancien',
  path: ['new_password'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
