/**
 * Prescription Query Hooks
 * React Query hooks for prescription data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const prescriptionKeys = {
  all: ['prescriptions'] as const,
  lists: () => [...prescriptionKeys.all, 'list'] as const,
  list: (filters: any) => [...prescriptionKeys.lists(), { filters }] as const,
  details: () => [...prescriptionKeys.all, 'detail'] as const,
  detail: (id: number) => [...prescriptionKeys.details(), id] as const,
};

// Fetch prescriptions list
export function usePrescriptions(params?: any) {
  return useQuery({
    queryKey: prescriptionKeys.list(params),
    queryFn: async () => {
      const { data } = await api.prescriptions.list(params);
      return data;
    },
  });
}

// Fetch single prescription
export function usePrescription(id: number) {
  return useQuery({
    queryKey: prescriptionKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.prescriptions.get(id);
      return data;
    },
    enabled: !!id,
  });
}

// Create prescription mutation
export function useCreatePrescription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.prescriptions.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
    },
  });
}

// Upload prescription mutation
export function useUploadPrescription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ file, data }: { file: File; data: any }) => {
      const response = await api.prescriptions.upload(file, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
    },
  });
}

// Update prescription mutation
export function useUpdatePrescription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await api.prescriptions.update(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.detail(variables.id) });
    },
  });
}

// Renew prescription mutation
export function useRenewPrescription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.prescriptions.renew(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.detail(id) });
    },
  });
}

// Cancel prescription mutation
export function useCancelPrescription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.prescriptions.cancel(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: prescriptionKeys.detail(id) });
    },
  });
}
