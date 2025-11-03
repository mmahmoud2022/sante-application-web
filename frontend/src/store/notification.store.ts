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
    const id = crypto.randomUUID();
    const newToast: Toast = { ...toast, id };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove toast after duration
    const duration = toast.duration || 5000;
    const timeoutId = setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);

    // Store timeout ID for cleanup
    (newToast as any).timeoutId = timeoutId;
  },

  removeToast: (id: string) => {
    set((state) => {
      const toastToRemove = state.toasts.find((t) => t.id === id);
      // Clear timeout if exists
      if (toastToRemove && (toastToRemove as any).timeoutId) {
        clearTimeout((toastToRemove as any).timeoutId);
      }
      return {
        toasts: state.toasts.filter((toast) => toast.id !== id),
      };
    });
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
