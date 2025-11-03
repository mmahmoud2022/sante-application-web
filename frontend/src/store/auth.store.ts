/**
 * Auth Store
 * Zustand store for authentication state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // Actions
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: true,

      login: async (email: string, password: string, rememberMe = false) => {
        try {
          set({ loading: true });
          
          const response = await api.auth.login(email, password, rememberMe);
          const { access_token, refresh_token } = response.data;

          // Fetch user data
          const userResponse = await api.users.me();
          const userData = userResponse.data;

          set({
            user: userData,
            token: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            loading: false,
          });

          // Sync tokens to localStorage for API interceptor
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', access_token);
            if (refresh_token) {
              localStorage.setItem('refresh_token', refresh_token);
            }
          }
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      logout: () => {
        api.auth.logout();
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },

      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      },

      initialize: async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        
        if (token) {
          try {
            const response = await api.users.me();
            set({
              user: response.data,
              token,
              isAuthenticated: true,
              loading: false,
            });
          } catch (error) {
            // Token is invalid, clear it
            if (typeof window !== 'undefined') {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
            }
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              loading: false,
            });
          }
        } else {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Computed selectors
export const useIsPatient = () => useAuthStore((state) => state.user?.role === 'patient');
export const useIsDoctor = () => useAuthStore((state) => state.user?.role === 'doctor');
export const useIsAdmin = () => useAuthStore((state) => state.user?.role === 'admin');
