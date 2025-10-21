/**
 * Doctor Dashboard Page
 * Enhanced with modern design, glassmorphism, carousels, and alerts
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Users, DollarSign, Heart, LogOut, Bell,
  Clock, CheckCircle, XCircle, TrendingUp, FileText, Stethoscope
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Carousel } from '@/components/ui/Carousel';
import { AlertsPanel } from '@/components/ui/AlertsPanel';
import api from '@/lib/api';
import logger from '@/lib/logger';
import { Appointment } from '@/types';

export default function DoctorDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingAppointments: 0,
    totalPatients: 0,
    revenue: 0,
  });
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'doctor') {
      router.push('/login');
      return;
    }

    if (user) {
      loadDashboardData();
    }
  }, [user, loading, router]);

  const loadDashboardData = async () => {
    try {
      const appointmentsRes = await api.appointments.list();
      const appointmentsList = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : (appointmentsRes.data as any).items || [];
      setAppointments(appointmentsList);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayApts = appointmentsList.filter(
        (apt: Appointment) => apt.appointment_date === today
      );
      const pending = appointmentsList.filter(
        (apt: Appointment) => apt.status === 'pending'
      );

      setStats({
        todayAppointments: todayApts.length,
        pendingAppointments: pending.length,
        totalPatients: new Set(appointmentsList.map((apt: Appointment) => apt.patient_id)).size,
        revenue: 0, // Would be calculated from payments
      });
    } catch (error: any) {
      logger.error('Failed to load dashboard data', {
        userId: user?.id,
        role: user?.role,
        errorMessage: error?.message,
      }, error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const todayAppointments = appointments.filter(
    (apt) => apt.appointment_date === new Date().toISOString().split('T')[0]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      {/* Header with glassmorphism */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-primary-500 to-secondary-500 p-2 rounded-xl shadow-medical">
                <Heart className="h-6 w-6 text-white" fill="white" />
              </div>
              <span className="text-2xl font-heading font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Santé</span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">| Espace Praticien</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2.5 text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all">
                <Bell className="h-6 w-6" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-warm-coral rounded-full ring-2 ring-white dark:ring-neutral-800 animate-pulse"></span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    Dr. {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 font-medium">{user.specialization || 'Médecin'}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2.5 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Se déconnecter"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-neutral-800 dark:text-neutral-100 mb-2">
            Bonjour, Dr. {user.last_name} 👨‍⚕️
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Voici un aperçu de votre activité aujourd&apos;hui
          </p>
        </div>

        {/* Stats Cards with modern design */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-200 dark:border-blue-700 shadow-medium hover:shadow-large transition-all hover-lift">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-1">Aujourd&apos;hui</p>
                  <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">{stats.todayAppointments}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 font-medium">Consultations</p>
                </div>
                <div className="p-3 bg-blue-200 dark:bg-blue-800/50 rounded-xl">
                  <Calendar className="h-10 w-10 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-2 border-yellow-200 dark:border-yellow-700 shadow-medium hover:shadow-large transition-all hover-lift">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold mb-1">En attente</p>
                  <p className="text-4xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pendingAppointments}</p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 font-medium">À confirmer</p>
                </div>
                <div className="p-3 bg-yellow-200 dark:bg-yellow-800/50 rounded-xl">
                  <Clock className="h-10 w-10 text-yellow-600 dark:text-yellow-400" strokeWidth={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-2 border-green-200 dark:border-green-700 shadow-medium hover:shadow-large transition-all hover-lift">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-semibold mb-1">Patients</p>
                  <p className="text-4xl font-bold text-green-900 dark:text-green-100">{stats.totalPatients}</p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1 font-medium">Total actifs</p>
                </div>
                <div className="p-3 bg-green-200 dark:bg-green-800/50 rounded-xl">
                  <Users className="h-10 w-10 text-green-600 dark:text-green-400" strokeWidth={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-2 border-purple-200 dark:border-purple-700 shadow-medium hover:shadow-large transition-all hover-lift">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold mb-1">Revenus</p>
                  <p className="text-4xl font-bold text-purple-900 dark:text-purple-100">-</p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1 font-medium">Ce mois</p>
                </div>
                <div className="p-3 bg-purple-200 dark:bg-purple-800/50 rounded-xl">
                  <DollarSign className="h-10 w-10 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments with Carousel */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-2 border-primary-100 dark:border-primary-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span>Consultations d&apos;aujourd&apos;hui</span>
                  </CardTitle>
                  <button
                    onClick={() => router.push('/doctor/appointments')}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold px-4 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                  >
                    Voir tout
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  </div>
                ) : todayAppointments.length > 0 ? (
                  <Carousel itemsPerView={1} showIndicators={true} autoPlay={true}>
                    {todayAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border-2 border-primary-100 dark:border-primary-800 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/20 dark:to-transparent rounded-xl p-6 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="p-2 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
                                <Stethoscope className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-neutral-800 dark:text-neutral-100">
                                  {appointment.patient?.first_name} {appointment.patient?.last_name}
                                </h4>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                  {appointment.chief_complaint || 'Consultation générale'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="flex items-center gap-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 py-1.5 rounded-full font-medium">
                                <Clock className="h-4 w-4" />
                                {appointment.appointment_time}
                              </span>
                              <span className="flex items-center gap-1 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 px-3 py-1.5 rounded-full font-medium">
                                {appointment.appointment_type === 'video' ? '📹 Vidéo' : '🏥 Cabinet'}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {appointment.status === 'pending' && (
                              <>
                                <button
                                  className="p-2.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all border-2 border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600"
                                  title="Confirmer"
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                                <button
                                  className="p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all border-2 border-red-200 dark:border-red-700 hover:border-red-300 dark:hover:border-red-600"
                                  title="Annuler"
                                >
                                  <XCircle className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </Carousel>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-600 dark:text-neutral-400">Aucune consultation aujourd&apos;hui</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Patients Carousel */}
            <Card className="glass-card border-2 border-secondary-100 dark:border-secondary-800 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-900 dark:to-secondary-800 rounded-lg">
                    <Users className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <span>Patients récents</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <Users className="h-10 w-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Vue des patients récemment consultés
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Urgent Alerts */}
            <AlertsPanel />

            {/* Quick Actions */}
            <Card className="glass-card border-2 border-neutral-100 dark:border-neutral-700">
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    fullWidth
                    onClick={() => router.push('/doctor/schedule')}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                        <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      Gérer mon agenda
                    </div>
                  </Button>
                  <Button
                    fullWidth
                    onClick={() => router.push('/doctor/patients')}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
                        <Users className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                      </div>
                      Mes patients
                    </div>
                  </Button>
                  <Button
                    fullWidth
                    onClick={() => router.push('/doctor/profile')}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      Mon profil
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card className="glass-card border-2 border-warm-coral/30 shadow-warm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-warm-coral/20 to-warm-coral/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-warm-coral" />
                  </div>
                  <span>Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-700">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Note moyenne</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-800 dark:text-neutral-100 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full text-sm">
                        {user.rating_average?.toFixed(1) || '-'}
                      </span>
                      <span className="text-xl">⭐</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-700">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Avis patients</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-100 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full text-sm">
                      {user.rating_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Consultations</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-100 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full text-sm">{appointments.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
