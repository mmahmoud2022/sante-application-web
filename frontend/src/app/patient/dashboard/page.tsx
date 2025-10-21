/**
 * Patient Dashboard Page
 * Enhanced with modern design, glassmorphism, carousels, and health metrics
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, FileText, Pill, Heart, User, LogOut, 
  Bell, Search, Clock, ChevronRight, Activity,
  CalendarCheck, AlertCircle, MessageSquare, Stethoscope
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Carousel } from '@/components/ui/Carousel';
import { HealthMetrics } from '@/components/ui/HealthMetrics';
import api from '@/lib/api';
import logger from '@/lib/logger';
import { Appointment, Prescription } from '@/types';

export default function PatientDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'patient') {
      router.push('/login');
      return;
    }

    if (user) {
      loadDashboardData();
    }
  }, [user, loading, router]);

  const loadDashboardData = async () => {
    try {
      const [appointmentsRes, prescriptionsRes] = await Promise.all([
        api.appointments.list({ limit: 5 }),
        api.prescriptions.list({ limit: 5, status: 'active' }),
      ]);
      
      const appointments = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : (appointmentsRes.data as any).items || [];
      const prescriptions = Array.isArray(prescriptionsRes.data) ? prescriptionsRes.data : (prescriptionsRes.data as any).items || [];
      
      setAppointments(appointments);
      setPrescriptions(prescriptions);
    } catch (error: any) {
      logger.error('Failed to load dashboard data', {
        userId: user?.id,
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

  const upcomingAppointments = appointments.filter(apt => 
    apt.status === 'confirmed' || apt.status === 'pending'
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
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2.5 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                <Bell className="h-6 w-6" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-warm-coral rounded-full ring-2 ring-white animate-pulse"></span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">Patient</p>
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
            Bonjour, {user.first_name} 👋
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Bienvenue sur votre espace personnel
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => router.push('/patient/search-doctors')}
            className="glass-card p-6 rounded-2xl hover:shadow-large transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-xl group-hover:scale-110 transition-transform">
                <Search className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-400 dark:text-neutral-500 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-1">Trouver un médecin</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Rechercher et prendre RDV</p>
          </button>

          <button
            onClick={() => router.push('/patient/appointments')}
            className="glass-card p-6 rounded-2xl hover:shadow-large transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-900 dark:to-secondary-800 rounded-xl group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-400 dark:text-neutral-500 group-hover:text-secondary-500 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-1">Mes rendez-vous</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{upcomingAppointments.length} à venir</p>
          </button>

          <button
            onClick={() => router.push('/patient/medical-records')}
            className="glass-card p-6 rounded-2xl hover:shadow-large transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-xl group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-accent-purple" />
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-400 dark:text-neutral-500 group-hover:text-accent-purple group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-1">Dossier médical</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Historique et documents</p>
          </button>

          <button
            onClick={() => router.push('/patient/prescriptions')}
            className="glass-card p-6 rounded-2xl hover:shadow-large transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900 dark:to-teal-800 rounded-xl group-hover:scale-110 transition-transform">
                <Pill className="h-6 w-6 text-accent-teal" />
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-400 dark:text-neutral-500 group-hover:text-accent-teal group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-1">Ordonnances</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{prescriptions.length} actives</p>
          </button>
        </div>

        {/* Health Metrics Section */}
        <div className="mb-8">
          <HealthMetrics />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments with Carousel */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-2 border-primary-100 dark:border-primary-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg">
                      <CalendarCheck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span>Prochains rendez-vous</span>
                  </CardTitle>
                  <button
                    onClick={() => router.push('/patient/appointments')}
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
                ) : upcomingAppointments.length > 0 ? (
                  <Carousel itemsPerView={1} showIndicators={true} autoPlay={true}>
                    {upcomingAppointments.map((appointment) => (
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
                                  Dr. {appointment.doctor?.first_name} {appointment.doctor?.last_name}
                                </h4>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                  {appointment.doctor?.specialization || 'Médecin'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="flex items-center gap-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 py-1.5 rounded-full font-medium">
                                <Calendar className="h-4 w-4" />
                                {new Date(appointment.appointment_date).toLocaleDateString('fr-FR', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </span>
                              <span className="flex items-center gap-1 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 px-3 py-1.5 rounded-full font-medium">
                                <Clock className="h-4 w-4" />
                                {appointment.appointment_time}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm ${
                              appointment.status === 'confirmed'
                                ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                                : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800'
                            }`}>
                              {appointment.status === 'confirmed' ? '✓ Confirmé' : '⏳ En attente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Carousel>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">Aucun rendez-vous à venir</p>
                    <Button
                      onClick={() => router.push('/patient/search-doctors')}
                      size="sm"
                    >
                      Prendre un rendez-vous
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Messages Section */}
            <Card className="glass-card border-2 border-secondary-100 dark:border-secondary-800 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-900 dark:to-secondary-800 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <span>Messages avec vos médecins</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <MessageSquare className="h-10 w-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    Communiquez facilement avec vos praticiens
                  </p>
                  <Button size="sm" variant="outline">
                    Nouveau message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Medication Reminders */}
            <Card className="glass-card border-2 border-warm-coral/30 shadow-warm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-warm-coral/20 to-warm-coral/10 rounded-lg">
                    <Pill className="h-5 w-5 text-warm-coral" />
                  </div>
                  <span>Rappels médicaments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                  </div>
                ) : prescriptions.length > 0 ? (
                  <div className="space-y-3">
                    {prescriptions.slice(0, 3).map((prescription) => (
                      <div
                        key={prescription.id}
                        className="border-l-4 border-warm-coral bg-gradient-to-r from-warm-coral/10 to-transparent pl-3 py-3 rounded-r-lg hover:from-warm-coral/20 transition-all"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
                            {prescription.medication_name}
                          </h5>
                          <span className="text-xs bg-warm-coral/20 text-warm-coral px-2 py-0.5 rounded-full font-bold">
                            Actif
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                          {prescription.dosage}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                          {prescription.frequency}
                        </p>
                      </div>
                    ))}
                    <button
                      onClick={() => router.push('/patient/prescriptions')}
                      className="w-full text-sm text-warm-coral hover:text-warm-coral/80 font-semibold py-2 hover:bg-warm-coral/10 rounded-lg transition-all"
                    >
                      Voir toutes les ordonnances →
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center py-4">
                    Aucune ordonnance active
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Health Stats */}
            <Card className="glass-card border-2 border-purple-100 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-lg">
                    <Activity className="h-5 w-5 text-accent-purple" />
                  </div>
                  <span>Vue d&apos;ensemble</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-700">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Consultations</span>
                    </div>
                    <span className="font-bold text-neutral-800 dark:text-neutral-100 bg-primary-100 dark:bg-primary-900/30 px-3 py-1 rounded-full text-sm">{appointments.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-700">
                    <div className="flex items-center space-x-2">
                      <Pill className="h-4 w-4 text-warm-coral" />
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Ordonnances</span>
                    </div>
                    <span className="font-bold text-neutral-800 dark:text-neutral-100 bg-warm-coral/20 px-3 py-1 rounded-full text-sm">{prescriptions.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">Documents</span>
                    </div>
                    <span className="font-bold text-neutral-800 dark:text-neutral-100 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full text-sm">-</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Completion */}
            <Card className="glass-card bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-2 border-primary-200 dark:border-primary-700 shadow-medical">
              <CardContent className="py-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-primary-500 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-1">
                      Complétez votre profil
                    </h5>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      Ajoutez vos informations médicales pour une meilleure prise en charge
                    </p>
                    <Button
                      size="sm"
                      onClick={() => router.push('/patient/profile')}
                    >
                      Compléter mon profil
                    </Button>
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
