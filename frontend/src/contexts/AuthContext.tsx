/**
 * Authentication Context
 * Manages user authentication state across the application
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User, LoginFormData } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginFormData) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isPatient: boolean;
  isDoctor: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await api.users.me();
          setUser(response.data);
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginFormData) => {
    try {
      const response = await api.auth.login(
        credentials.email,
        credentials.password,
        credentials.remember_me ?? false
      );
      const { access_token, refresh_token } = response.data;

      localStorage.setItem('access_token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }

      const userResponse = await api.users.me();
      const userData = userResponse.data;

      setUser(userData);

      // Redirect based on role
      if (userData.role === 'patient') {
        router.push('/patient/dashboard');
      } else if (userData.role === 'doctor') {
        // Check if doctor is verified
        if (!userData.is_verified) {
          // Don't redirect, stay on login page to show verification message
          throw new Error('VERIFICATION_PENDING');
        }
        router.push('/doctor/dashboard');
      } else if (userData.role === 'admin') {
        router.push('/admin/verify-doctors');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    router.push('/login');
  };

  const register = async (data: any) => {
    try {
      const response = await api.auth.register(data);
      // After registration, user might need to verify email
      // For now, we'll just redirect to login
      router.push('/login?registered=true');
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      const response = await api.users.update(data as any);
      setUser(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Update failed');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    updateUser,
    isAuthenticated: !!user,
    isPatient: user?.role === 'patient',
    isDoctor: user?.role === 'doctor',
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
