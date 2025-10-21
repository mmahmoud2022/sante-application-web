/**
 * Sidebar Component
 * Modern sidebar with health icons and glassmorphism effects
 */

'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  FileText,
  Heart,
  Stethoscope,
  Users,
  Settings,
  Activity,
  Pill,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  userRole: 'patient' | 'doctor';
  onLogout?: () => void;
  className?: string;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

export function Sidebar({ userRole, onLogout, className }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const patientNavItems: NavItem[] = [
    {
      label: 'Tableau de bord',
      path: '/patient/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      label: 'Rendez-vous',
      path: '/patient/appointments',
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      label: 'Messages',
      path: '/patient/messages',
      icon: <MessageSquare className="h-5 w-5" />,
      badge: 3,
    },
    {
      label: 'Dossier médical',
      path: '/patient/medical-records',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      label: 'Ordonnances',
      path: '/patient/prescriptions',
      icon: <Pill className="h-5 w-5" />,
    },
    {
      label: 'Rechercher médecin',
      path: '/patient/search-doctors',
      icon: <Stethoscope className="h-5 w-5" />,
    },
    {
      label: 'Profil',
      path: '/patient/profile',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const doctorNavItems: NavItem[] = [
    {
      label: 'Tableau de bord',
      path: '/doctor/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      label: 'Rendez-vous',
      path: '/doctor/appointments',
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      label: 'Mes patients',
      path: '/doctor/patients',
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: 'Agenda',
      path: '/doctor/schedule',
      icon: <Activity className="h-5 w-5" />,
    },
    {
      label: 'Profil',
      path: '/doctor/profile',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const navItems = userRole === 'patient' ? patientNavItems : doctorNavItems;

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <aside
      className={clsx(
        'h-screen sticky top-0 w-64 flex flex-col',
        'bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl',
        'border-r border-neutral-200/50 dark:border-neutral-700/50',
        'shadow-xl',
        className
      )}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-700/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl shadow-lg">
            <Heart className="h-6 w-6 text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Santé
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {userRole === 'patient' ? 'Espace Patient' : 'Espace Praticien'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={clsx(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl',
                    'transition-all duration-300 group',
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={clsx(
                        'p-2 rounded-lg transition-all duration-300',
                        isActive
                          ? 'bg-white/20'
                          : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 group-hover:scale-110'
                      )}
                    >
                      {item.icon}
                    </div>
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded-full text-xs font-bold',
                        isActive
                          ? 'bg-white/30 text-white'
                          : 'bg-warm-coral text-white'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      {onLogout && (
        <div className="p-4 border-t border-neutral-200/50 dark:border-neutral-700/50">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 group"
          >
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 group-hover:scale-110 transition-transform">
              <LogOut className="h-5 w-5" />
            </div>
            <span className="font-medium text-sm">Se déconnecter</span>
          </button>
        </div>
      )}
    </aside>
  );
}
