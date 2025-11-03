/**
 * Notification Query Hooks
 * React Query hooks for notification data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: any) => [...notificationKeys.lists(), { filters }] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

// Fetch notifications list
export function useNotifications(params?: any) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: async () => {
      const { data } = await api.notifications.list(params);
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Fetch unread count
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const { data } = await api.notifications.unreadCount();
      return data;
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  });
}

// Mark notification as read mutation
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.notifications.markAsRead(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}

// Mark all notifications as read mutation
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await api.notifications.markAllAsRead();
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });
}
