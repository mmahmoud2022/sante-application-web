/**
 * Patient Dashboard Page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, FileText, Pill, Heart, User, LogOut, 
  Bell, Search, Clock, ChevronRight, Activity,
  CalendarCheck, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
      {/* Header */}
      <header className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md shadow-soft border-b border-neutral-100 dark:border-neutral-700 sticky top-0 z-50">
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
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
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
            className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-soft hover:shadow-large transition-all group border border-neutral-100 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-500"
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
            className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-soft hover:shadow-large transition-all group border border-neutral-100 dark:border-neutral-700 hover:border-secondary-300 dark:hover:border-secondary-500"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-900 dark:to-secondary-800 rounded-xl group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-400 dark:text-neutral-500 group-hover:text-secondary-500 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-neutral-800 mb-1">Mes rendez-vous</h3>
            <p className="text-sm text-neutral-600">{upcomingAppointments.length} à venir</p>
          </button>

          <button
            onClick={() => router.push('/patient/medical-records')}
            className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-large transition-all group border border-neutral-100 hover:border-accent-purple/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-accent-purple" />
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-accent-purple group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-neutral-800 mb-1">Dossier médical</h3>
            <p className="text-sm text-neutral-600">Historique et documents</p>
          </button>

          <button
            onClick={() => router.push('/patient/prescriptions')}
            className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-large transition-all group border border-neutral-100 hover:border-accent-teal/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl group-hover:scale-110 transition-transform">
                <Pill className="h-6 w-6 text-accent-teal" />
              </div>
              <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-accent-teal group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-neutral-800 mb-1">Ordonnances</h3>
            <p className="text-sm text-neutral-600">{prescriptions.length} actives</p>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-neutral-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg">
                      <CalendarCheck className="h-5 w-5 text-primary-600" />
                    </div>
                    <span>Prochains rendez-vous</span>
                  </CardTitle>
                  <button
                    onClick={() => router.push('/patient/appointments')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-semibold px-4 py-2 hover:bg-primary-50 rounded-lg transition-all"
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
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border-2 border-neutral-100 rounded-xl p-4 hover:border-primary-300 hover:shadow-medium transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-neutral-800 mb-1">
                              Dr. {appointment.doctor?.first_name} {appointment.doctor?.last_name}
                            </h4>
                            <p className="text-sm text-neutral-600 mb-2">
                              {appointment.doctor?.specialization || 'Médecin'}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-neutral-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-primary-500" />
                                {new Date(appointment.appointment_date).toLocaleDateString('fr-FR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-secondary-500" />
                                {appointment.appointment_time}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                              appointment.status === 'confirmed'
                                ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                                : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800'
                            }`}>
                              {appointment.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-600 mb-4">Aucun rendez-vous à venir</p>
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
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Active Prescriptions */}
            <Card className="border-2 border-neutral-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg">
                    <Pill className="h-5 w-5 text-accent-teal" />
                  </div>
                  <span>Ordonnances actives</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                  </div>
                ) : prescriptions.length > 0 ? (
                  <div className="space-y-3">
                    {prescriptions.map((prescription) => (
                      <div
                        key={prescription.id}
                        className="border-l-4 border-primary-500 bg-primary-50 pl-3 py-2 rounded-r-lg"
                      >
                        <h5 className="font-semibold text-sm text-neutral-800">
                          {prescription.medication_name}
                        </h5>
                        <p className="text-xs text-neutral-600">
                          {prescription.dosage} - {prescription.frequency}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          Jusqu&apos;au {new Date(prescription.end_date || '').toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))}
                    <button
                      onClick={() => router.push('/patient/prescriptions')}
                      className="w-full text-sm text-primary-600 hover:text-primary-700 font-semibold py-2 hover:bg-primary-50 rounded-lg transition-all"
                    >
                      Voir toutes les ordonnances
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-600 text-center py-4">
                    Aucune ordonnance active
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Health Stats */}
            <Card className="border-2 border-neutral-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
                    <Activity className="h-5 w-5 text-accent-purple" />
                  </div>
                  <span>Statistiques santé</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                    <span className="text-sm text-neutral-600">Consultations</span>
                    <span className="font-semibold text-neutral-800 bg-primary-100 px-3 py-1 rounded-full text-sm">{appointments.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                    <span className="text-sm text-neutral-600">Ordonnances</span>
                    <span className="font-semibold text-neutral-800 bg-secondary-100 px-3 py-1 rounded-full text-sm">{prescriptions.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-neutral-600">Documents</span>
                    <span className="font-semibold text-neutral-800 bg-purple-100 px-3 py-1 rounded-full text-sm">-</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Completion */}
            <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200 shadow-medical">
              <CardContent className="py-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-primary-500 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-neutral-800 mb-1">
                      Complétez votre profil
                    </h5>
                    <p className="text-sm text-neutral-600 mb-3">
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
