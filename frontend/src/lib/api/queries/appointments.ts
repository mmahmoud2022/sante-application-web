/**
 * Appointment Query Hooks
 * React Query hooks for appointment data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (filters: any) => [...appointmentKeys.lists(), { filters }] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: number) => [...appointmentKeys.details(), id] as const,
  availableSlots: (doctorId: number, date: string) => 
    [...appointmentKeys.all, 'available-slots', { doctorId, date }] as const,
  stats: () => [...appointmentKeys.all, 'stats'] as const,
};

// Fetch appointments list
export function useAppointments(params?: any) {
  return useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: async () => {
      const { data } = await api.appointments.list(params);
      return data;
    },
  });
}

// Fetch single appointment
export function useAppointment(id: number) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.appointments.get(id);
      return data;
    },
    enabled: !!id,
  });
}

// Fetch available slots
export function useAvailableSlots(doctorId: number, date: string) {
  return useQuery({
    queryKey: appointmentKeys.availableSlots(doctorId, date),
    queryFn: async () => {
      const { data } = await api.appointments.getAvailableSlots(doctorId, date);
      return data;
    },
    enabled: !!doctorId && !!date,
    staleTime: 1 * 60 * 1000, // 1 minute - slots change frequently
  });
}

// Fetch appointment stats
export function useAppointmentStats() {
  return useQuery({
    queryKey: appointmentKeys.stats(),
    queryFn: async () => {
      const { data } = await api.appointments.stats();
      return data;
    },
  });
}

// Create appointment mutation
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.appointments.create(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch appointments
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.stats() });
    },
  });
}

// Update appointment mutation
export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await api.appointments.update(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.stats() });
    },
  });
}

// Cancel appointment mutation
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.appointments.cancel(id, reason);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.stats() });
    },
  });
}

// Confirm appointment mutation
export function useConfirmAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.appointments.confirm(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.stats() });
    },
  });
}

// Complete appointment mutation
export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: any }) => {
      const response = await api.appointments.complete(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.stats() });
    },
  });
}
