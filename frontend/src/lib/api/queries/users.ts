/**
 * User Query Hooks
 * React Query hooks for user data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: any) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  me: () => [...userKeys.all, 'me'] as const,
  doctors: () => [...userKeys.all, 'doctors'] as const,
  doctor: (id: number) => [...userKeys.doctors(), id] as const,
  stats: () => [...userKeys.all, 'stats'] as const,
};

// Fetch current user
export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: async () => {
      const { data } = await api.users.me();
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch users list
export function useUsers(params?: any) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      const { data } = await api.users.list(params);
      return data;
    },
  });
}

// Fetch doctors list
export function useDoctors(params?: any) {
  return useQuery({
    queryKey: [...userKeys.doctors(), { params }],
    queryFn: async () => {
      const { data } = await api.users.doctors(params);
      return data;
    },
  });
}

// Fetch single doctor
export function useDoctor(id: number) {
  return useQuery({
    queryKey: userKeys.doctor(id),
    queryFn: async () => {
      const { data } = await api.users.getDoctor(id);
      return data;
    },
    enabled: !!id,
  });
}

// Fetch user stats
export function useUserStats() {
  return useQuery({
    queryKey: userKeys.stats(),
    queryFn: async () => {
      const { data } = await api.users.stats();
      return data;
    },
  });
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.users.update(data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
      queryClient.setQueryData(userKeys.me(), data);
    },
  });
}

// Delete user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.users.delete(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
  });
}

// Verify user mutation
export function useVerifyUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.users.verify(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
  });
}
