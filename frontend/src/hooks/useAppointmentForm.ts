/**
 * Appointment Form Hook
 * Provides form validation and management for appointment booking
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  appointmentSchema, 
  AppointmentFormData,
  appointmentUpdateSchema,
  AppointmentUpdateFormData,
  appointmentCancellationSchema,
  AppointmentCancellationFormData,
} from '@/lib/validation/appointment.schema';

/**
 * Hook for appointment creation form
 */
export function useAppointmentForm(defaultValues?: Partial<AppointmentFormData>) {
  return useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    mode: 'onBlur', // Validate on blur for better UX
    defaultValues,
  });
}

/**
 * Hook for appointment update form
 */
export function useAppointmentUpdateForm(defaultValues?: Partial<AppointmentUpdateFormData>) {
  return useForm<AppointmentUpdateFormData>({
    resolver: zodResolver(appointmentUpdateSchema),
    mode: 'onBlur',
    defaultValues,
  });
}

/**
 * Hook for appointment cancellation form
 */
export function useAppointmentCancellationForm(defaultValues?: Partial<AppointmentCancellationFormData>) {
  return useForm<AppointmentCancellationFormData>({
    resolver: zodResolver(appointmentCancellationSchema),
    mode: 'onBlur',
    defaultValues,
  });
}
