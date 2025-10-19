/**
 * Doctor Dashboard Page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Users, DollarSign, Heart, LogOut, Bell,
  Clock, CheckCircle, XCircle, TrendingUp, FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
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
      const appointmentsList = appointmentsRes.data.items || appointmentsRes.data || [];
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
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Heart className="h-8 w-8 text-primary" />
              <span className="text-2xl font-heading font-bold text-primary">Santé</span>
              <span className="text-sm text-neutral-500">| Espace Praticien</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-neutral-600 hover:text-primary transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-800">
                    Dr. {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-neutral-500">{user.specialization || 'Médecin'}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-neutral-600 hover:text-red-600 transition-colors"
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
          <h1 className="text-3xl font-heading font-bold text-neutral-800 mb-2">
            Bonjour, Dr. {user.last_name} 👨‍⚕️
          </h1>
          <p className="text-neutral-600">
            Voici un aperçu de votre activité aujourd&apos;hui
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium mb-1">Aujourd&apos;hui</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.todayAppointments}</p>
                  <p className="text-xs text-blue-700 mt-1">Consultations</p>
                </div>
                <Calendar className="h-12 w-12 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium mb-1">En attente</p>
                  <p className="text-3xl font-bold text-yellow-900">{stats.pendingAppointments}</p>
                  <p className="text-xs text-yellow-700 mt-1">À confirmer</p>
                </div>
                <Clock className="h-12 w-12 text-yellow-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium mb-1">Patients</p>
                  <p className="text-3xl font-bold text-green-900">{stats.totalPatients}</p>
                  <p className="text-xs text-green-700 mt-1">Total actifs</p>
                </div>
                <Users className="h-12 w-12 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium mb-1">Revenus</p>
                  <p className="text-3xl font-bold text-purple-900">-</p>
                  <p className="text-xs text-purple-700 mt-1">Ce mois</p>
                </div>
                <DollarSign className="h-12 w-12 text-purple-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-6 w-6 text-primary" />
                    <span>Consultations d&apos;aujourd&apos;hui</span>
                  </CardTitle>
                  <button
                    onClick={() => router.push('/doctor/appointments')}
                    className="text-sm text-primary hover:text-primary-dark font-semibold"
                  >
                    Voir tout
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : todayAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {todayAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border border-neutral-200 rounded-lg p-4 hover:border-primary transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-neutral-800 mb-1">
                              {appointment.patient?.first_name} {appointment.patient?.last_name}
                            </h4>
                            <p className="text-sm text-neutral-600 mb-2">
                              {appointment.chief_complaint || 'Consultation'}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-neutral-600">
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {appointment.appointment_time}
                              </span>
                              <span className="flex items-center">
                                {appointment.appointment_type === 'video' ? '📹 Vidéo' : '🏥 Cabinet'}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {appointment.status === 'pending' && (
                              <>
                                <button
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Confirmer"
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                                <button
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-600">Aucune consultation aujourd&apos;hui</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
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
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Gérer mon agenda
                  </Button>
                  <Button
                    fullWidth
                    onClick={() => router.push('/doctor/patients')}
                    variant="outline"
                    size="sm"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Mes patients
                  </Button>
                  <Button
                    fullWidth
                    onClick={() => router.push('/doctor/profile')}
                    variant="outline"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Mon profil
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <span>Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-neutral-200">
                    <span className="text-sm text-neutral-600">Note moyenne</span>
                    <div className="flex items-center">
                      <span className="font-semibold text-neutral-800 mr-1">
                        {user.rating_average?.toFixed(1) || '-'}
                      </span>
                      <span className="text-yellow-500">⭐</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-neutral-200">
                    <span className="text-sm text-neutral-600">Avis patients</span>
                    <span className="font-semibold text-neutral-800">
                      {user.rating_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-neutral-600">Consultations</span>
                    <span className="font-semibold text-neutral-800">{appointments.length}</span>
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
