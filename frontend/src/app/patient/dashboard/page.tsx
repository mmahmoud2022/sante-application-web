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
      
      setAppointments(appointmentsRes.data.items || appointmentsRes.data || []);
      setPrescriptions(prescriptionsRes.data.items || prescriptionsRes.data || []);
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

  const upcomingAppointments = appointments.filter(apt => 
    apt.status === 'confirmed' || apt.status === 'pending'
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
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-neutral-600 hover:text-primary transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-800">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-neutral-500">Patient</p>
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
            Bonjour, {user.first_name} 👋
          </h1>
          <p className="text-neutral-600">
            Bienvenue sur votre espace personnel
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => router.push('/patient/search-doctors')}
            className="bg-white p-6 rounded-xl shadow-soft hover:shadow-medium transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <Search className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              <ChevronRight className="h-5 w-5 text-neutral-400" />
            </div>
            <h3 className="font-semibold text-neutral-800 mb-1">Trouver un médecin</h3>
            <p className="text-sm text-neutral-600">Rechercher et prendre RDV</p>
          </button>

          <button
            onClick={() => router.push('/patient/appointments')}
            className="bg-white p-6 rounded-xl shadow-soft hover:shadow-medium transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <Calendar className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              <ChevronRight className="h-5 w-5 text-neutral-400" />
            </div>
            <h3 className="font-semibold text-neutral-800 mb-1">Mes rendez-vous</h3>
            <p className="text-sm text-neutral-600">{upcomingAppointments.length} à venir</p>
          </button>

          <button
            onClick={() => router.push('/patient/medical-records')}
            className="bg-white p-6 rounded-xl shadow-soft hover:shadow-medium transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <FileText className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              <ChevronRight className="h-5 w-5 text-neutral-400" />
            </div>
            <h3 className="font-semibold text-neutral-800 mb-1">Dossier médical</h3>
            <p className="text-sm text-neutral-600">Historique et documents</p>
          </button>

          <button
            onClick={() => router.push('/patient/prescriptions')}
            className="bg-white p-6 rounded-xl shadow-soft hover:shadow-medium transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <Pill className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
              <ChevronRight className="h-5 w-5 text-neutral-400" />
            </div>
            <h3 className="font-semibold text-neutral-800 mb-1">Ordonnances</h3>
            <p className="text-sm text-neutral-600">{prescriptions.length} actives</p>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarCheck className="h-6 w-6 text-primary" />
                    <span>Prochains rendez-vous</span>
                  </CardTitle>
                  <button
                    onClick={() => router.push('/patient/appointments')}
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
                ) : upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border border-neutral-200 rounded-lg p-4 hover:border-primary transition-colors"
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
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(appointment.appointment_date).toLocaleDateString('fr-FR')}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {appointment.appointment_time}
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              appointment.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Pill className="h-6 w-6 text-primary" />
                  <span>Ordonnances actives</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : prescriptions.length > 0 ? (
                  <div className="space-y-3">
                    {prescriptions.map((prescription) => (
                      <div
                        key={prescription.id}
                        className="border-l-4 border-primary pl-3 py-2"
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
                      className="w-full text-sm text-primary hover:text-primary-dark font-semibold py-2"
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-6 w-6 text-primary" />
                  <span>Statistiques santé</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-neutral-200">
                    <span className="text-sm text-neutral-600">Consultations</span>
                    <span className="font-semibold text-neutral-800">{appointments.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-neutral-200">
                    <span className="text-sm text-neutral-600">Ordonnances</span>
                    <span className="font-semibold text-neutral-800">{prescriptions.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-neutral-600">Documents</span>
                    <span className="font-semibold text-neutral-800">-</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Completion */}
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
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
