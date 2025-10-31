/**
 * Appointment Validation Schema Tests
 */

import { describe, it, expect } from 'vitest';
import { 
  appointmentSchema, 
  appointmentUpdateSchema,
  appointmentCancellationSchema 
} from './appointment.schema';

describe('appointmentSchema', () => {
  it('validates a valid appointment', () => {
    const validData = {
      doctor_id: 1,
      appointment_date: '2024-12-25',
      appointment_time: '14:30',
      appointment_type: 'in_person' as const,
      reason: 'Regular checkup for annual physical examination',
    };

    const result = appointmentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts video_call type', () => {
    const data = {
      doctor_id: 1,
      appointment_date: '2024-12-25',
      appointment_time: '14:30',
      appointment_type: 'video_call' as const,
      reason: 'Follow-up consultation',
    };

    const result = appointmentSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('accepts phone_call type', () => {
    const data = {
      doctor_id: 1,
      appointment_date: '2024-12-25',
      appointment_time: '14:30',
      appointment_type: 'phone_call' as const,
      reason: 'Quick consultation',
    };

    const result = appointmentSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects invalid appointment type', () => {
    const data = {
      doctor_id: 1,
      appointment_date: '2024-12-25',
      appointment_time: '14:30',
      appointment_type: 'invalid' as any,
      reason: 'Regular checkup',
    };

    const result = appointmentSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects invalid doctor_id', () => {
    const data = {
      doctor_id: 0,
      appointment_date: '2024-12-25',
      appointment_time: '14:30',
      appointment_type: 'in_person' as const,
      reason: 'Regular checkup',
    };

    const result = appointmentSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects short reason', () => {
    const data = {
      doctor_id: 1,
      appointment_date: '2024-12-25',
      appointment_time: '14:30',
      appointment_type: 'in_person' as const,
      reason: 'Short',
    };

    const result = appointmentSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('reason');
    }
  });

  it('rejects too long reason', () => {
    const data = {
      doctor_id: 1,
      appointment_date: '2024-12-25',
      appointment_time: '14:30',
      appointment_type: 'in_person' as const,
      reason: 'a'.repeat(501),
    };

    const result = appointmentSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('accepts optional notes', () => {
    const data = {
      doctor_id: 1,
      appointment_date: '2024-12-25',
      appointment_time: '14:30',
      appointment_type: 'in_person' as const,
      reason: 'Regular checkup',
      notes: 'Patient prefers morning appointments',
    };

    const result = appointmentSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects invalid date format', () => {
    const data = {
      doctor_id: 1,
      appointment_date: '25-12-2024',
      appointment_time: '14:30',
      appointment_type: 'in_person' as const,
      reason: 'Regular checkup',
    };

    const result = appointmentSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects invalid time format', () => {
    const data = {
      doctor_id: 1,
      appointment_date: '2024-12-25',
      appointment_time: '2:30 PM',
      appointment_type: 'in_person' as const,
      reason: 'Regular checkup',
    };

    const result = appointmentSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('appointmentUpdateSchema', () => {
  it('validates optional date update', () => {
    const data = {
      appointment_date: '2024-12-26',
    };

    const result = appointmentUpdateSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('validates optional time update', () => {
    const data = {
      appointment_time: '15:00',
    };

    const result = appointmentUpdateSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('validates empty update', () => {
    const data = {};

    const result = appointmentUpdateSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe('appointmentCancellationSchema', () => {
  it('validates valid cancellation', () => {
    const data = {
      cancellation_reason: 'Unable to attend due to emergency',
    };

    const result = appointmentCancellationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects short cancellation reason', () => {
    const data = {
      cancellation_reason: 'Short',
    };

    const result = appointmentCancellationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects too long cancellation reason', () => {
    const data = {
      cancellation_reason: 'a'.repeat(501),
    };

    const result = appointmentCancellationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
