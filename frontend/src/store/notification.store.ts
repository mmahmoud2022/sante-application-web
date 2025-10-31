/**
 * Notification Store
 * Zustand store for toast notifications
 */

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface NotificationState {
  toasts: Toast[];
  
  // Actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],

  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove toast after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearAllToasts: () => {
    set({ toasts: [] });
  },
}));

// Convenience hooks for common toast types
export const useToast = () => {
  const addToast = useNotificationStore((state) => state.addToast);
  
  return {
    success: (title: string, description?: string) => 
      addToast({ title, description, type: 'success' }),
    error: (title: string, description?: string) => 
      addToast({ title, description, type: 'error' }),
    warning: (title: string, description?: string) => 
      addToast({ title, description, type: 'warning' }),
    info: (title: string, description?: string) => 
      addToast({ title, description, type: 'info' }),
  };
};
