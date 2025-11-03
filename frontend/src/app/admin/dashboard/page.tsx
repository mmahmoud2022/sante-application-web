/**
 * Admin Dashboard Page
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Calendar,
  Heart,
  LogOut,
  Bell,
  TrendingUp,
  Activity,
  Shield,
  Settings,
  UserCheck,
  AlertTriangle,
  User as UserIcon,
  Trash2,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import logger from '@/lib/logger';
import type { Appointment, User as UserType } from '@/types';
import { AppointmentStatus } from '@/types';

type DoctorInsight = {
  id: number;
  fullName: string;
  email: string;
  specialization?: string;
  totalAppointments: number;
  refusals: number;
  patientCancellations: number;
};

type PatientInsight = {
  id: number;
  fullName: string;
  email: string;
  totalAppointments: number;
  cancellations: number;
  completedAppointments: number;
};

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    pendingVerifications: 0,
    activeUsers: 0,
    doctorsBySpecialization: {} as Record<string, number>,
    cancelledByPatient: 0,
    cancelledByDoctor: 0,
  });
  const [loadingData, setLoadingData] = useState(true);
  const [doctorInsights, setDoctorInsights] = useState<DoctorInsight[]>([]);
  const [patientInsights, setPatientInsights] = useState<PatientInsight[]>([]);
  const [deletingUserIds, setDeletingUserIds] = useState<number[]>([]);

  const loadDashboardData = useCallback(async () => {
    setLoadingData(true);

    try {
      const [userStatsRes, appointmentStatsRes, appointmentsRes] = await Promise.all([
        api.users.stats(),
        api.appointments.stats(),
        api.appointments.list({ limit: 100 }),
      ]);

      const userStats = userStatsRes.data;
      const appointmentStats = appointmentStatsRes.data;
      const appointments = extractItems<Appointment>(appointmentsRes.data);

      setStats({
        totalUsers: userStats.total_users || 0,
        totalDoctors: userStats.total_doctors || 0,
        totalPatients: userStats.total_patients || 0,
        totalAppointments: appointmentStats.total_appointments || 0,
        pendingVerifications: userStats.unverified_doctors || 0,
        activeUsers: userStats.active_users || 0,
        doctorsBySpecialization: userStats.doctors_by_specialization || {},
        cancelledByPatient: appointmentStats.cancelled_by_patient || 0,
        cancelledByDoctor: appointmentStats.cancelled_by_doctor || 0,
      });

      const { doctors, patients } = buildInsights(appointments);
      setDoctorInsights(doctors);
      setPatientInsights(patients);
    } catch (error: any) {
      logger.error('Failed to load dashboard data', {
        userId: user?.id,
        role: user?.role,
        errorMessage: error?.message,
      }, error);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'admin') {
      router.push('/login');
      return;
    }

    if (user) {
      void loadDashboardData();
    }
  }, [user, loading, router, loadDashboardData]);

  const handleDeleteUser = async (targetId: number, displayName: string) => {
    if (!confirm(`Confirmez-vous la suppression du compte ${displayName} ?`)) {
      return;
    }

    setDeletingUserIds((prev) => prev.includes(targetId) ? prev : [...prev, targetId]);

    try {
      await api.users.delete(targetId);
      alert('Compte supprimé avec succès');
      await loadDashboardData();
    } catch (error: any) {
      logger.error('Failed to delete user from admin dashboard', {
        userId: user?.id,
        targetId,
        errorMessage: error?.message,
      }, error);
      alert('Impossible de supprimer ce compte pour le moment');
    } finally {
      setDeletingUserIds((prev) => prev.filter((id) => id !== targetId));
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-neutral-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-primary-500 to-secondary-500 p-2 rounded-xl shadow-medical">
                <Heart className="h-6 w-6 text-white" fill="white" />
              </div>
              <span className="text-2xl font-heading font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Santé</span>
              <span className="text-sm text-neutral-500 font-medium">| Administration</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2.5 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                <Bell className="h-6 w-6" />
                {stats.pendingVerifications > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-800">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-purple-600 font-medium">Administrateur</p>
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
          <h1 className="text-3xl font-heading font-bold text-neutral-800 mb-2">
            Tableau de bord administrateur 🛡️
          </h1>
          <p className="text-neutral-600">
            Vue d&apos;ensemble du système et des utilisateurs
          </p>
        </div>

        {/* Alert for pending verifications */}
        {stats.pendingVerifications > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 shadow-medium">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-200 rounded-xl">
                    <AlertTriangle className="h-6 w-6 text-yellow-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-800">
                      {stats.pendingVerifications} médecin(s) en attente de vérification
                    </h4>
                    <p className="text-sm text-neutral-600">
                      Vérifiez les informations et approuvez les comptes
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => router.push('/admin/verify-doctors')}
                  variant="outline"
                  size="sm"
                >
                  Vérifier maintenant
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-medium hover:shadow-large transition-all">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-semibold mb-1">Utilisateurs</p>
                  <p className="text-4xl font-bold text-blue-900">{stats.totalUsers}</p>
                  <p className="text-xs text-blue-700 mt-1 font-medium">
                    {stats.activeUsers} actifs
                  </p>
                </div>
                <div className="p-3 bg-blue-200 rounded-xl">
                  <Users className="h-10 w-10 text-blue-600" strokeWidth={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 shadow-medium hover:shadow-large transition-all">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-semibold mb-1">Médecins</p>
                  <p className="text-4xl font-bold text-green-900">{stats.totalDoctors}</p>
                  <button
                    type="button"
                    onClick={() => router.push('/admin/verify-doctors')}
                    className="text-xs text-green-700 mt-1 font-medium underline decoration-dotted transition-colors hover:text-green-800"
                  >
                    {stats.pendingVerifications} à vérifier
                  </button>
                </div>
                <div className="p-3 bg-green-200 rounded-xl">
                  <UserCheck className="h-10 w-10 text-green-600" strokeWidth={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 shadow-medium hover:shadow-large transition-all">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-semibold mb-1">Patients</p>
                  <p className="text-4xl font-bold text-purple-900">{stats.totalPatients}</p>
                  <p className="text-xs text-purple-700 mt-1 font-medium">Total inscrits</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-xl">
                  <Heart className="h-10 w-10 text-purple-600" strokeWidth={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 shadow-medium hover:shadow-large transition-all">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-semibold mb-1">Rendez-vous</p>
                  <p className="text-4xl font-bold text-orange-900">{stats.totalAppointments}</p>
                  <p className="text-xs text-orange-700 mt-1 font-medium">Total réservés</p>
                </div>
                <div className="p-3 bg-orange-200 rounded-xl">
                  <Calendar className="h-10 w-10 text-orange-600" strokeWidth={2} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-neutral-100">
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => router.push('/admin/users')}
                    className="p-6 border-2 border-neutral-100 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all text-left group"
                  >
                    <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6 text-primary-600" />
                    </div>
                    <h4 className="font-semibold text-neutral-800 mb-1">
                      Gérer les utilisateurs
                    </h4>
                    <p className="text-sm text-neutral-600">
                      Voir, vérifier et gérer tous les comptes
                    </p>
                  </button>

                  <button
                    onClick={() => router.push('/admin/content')}
                    className="p-6 border-2 border-neutral-100 rounded-xl hover:border-secondary-300 hover:bg-secondary-50 transition-all text-left group"
                  >
                    <div className="p-3 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform">
                      <Activity className="h-6 w-6 text-secondary-600" />
                    </div>
                    <h4 className="font-semibold text-neutral-800 mb-1">
                      Gestion du contenu
                    </h4>
                    <p className="text-sm text-neutral-600">
                      Spécialisations, localités, annonces
                    </p>
                  </button>

                  <button
                    onClick={() => router.push('/admin/reports')}
                    className="p-6 border-2 border-neutral-100 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all text-left group"
                  >
                    <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-neutral-800 mb-1">
                      Rapports et analytics
                    </h4>
                    <p className="text-sm text-neutral-600">
                      Statistiques et métriques détaillées
                    </p>
                  </button>

                  <button
                    onClick={() => router.push('/admin/settings')}
                    className="p-6 border-2 border-neutral-100 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all text-left group"
                  >
                    <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl inline-block mb-3 group-hover:scale-110 transition-transform">
                      <Settings className="h-6 w-6 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-neutral-800 mb-1">
                      Configuration système
                    </h4>
                    <p className="text-sm text-neutral-600">
                      Paramètres, templates, fonctionnalités
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* System Health */}
            <Card className="border-2 border-neutral-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <span>Santé du système</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                    <span className="text-sm text-neutral-600">Status API</span>
                    <span className="flex items-center text-green-600 font-semibold text-sm bg-green-50 px-3 py-1 rounded-full">
                      <div className="h-2 w-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
                      Opérationnel
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                    <span className="text-sm text-neutral-600">Base de données</span>
                    <span className="flex items-center text-green-600 font-semibold text-sm bg-green-50 px-3 py-1 rounded-full">
                      <div className="h-2 w-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
                      Connectée
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-neutral-600">Services</span>
                    <span className="flex items-center text-green-600 font-semibold text-sm bg-green-50 px-3 py-1 rounded-full">
                      <div className="h-2 w-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
                      Actifs
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-2 border-neutral-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <span>Activité récente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2 py-2 border-b border-neutral-200">
                    <div className="h-2 w-2 bg-primary rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-neutral-800">Nouvel utilisateur inscrit</p>
                      <p className="text-xs text-neutral-500">Il y a 5 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 py-2 border-b border-neutral-200">
                    <div className="h-2 w-2 bg-primary rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-neutral-800">Médecin vérifié</p>
                      <p className="text-xs text-neutral-500">Il y a 1 heure</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 py-2">
                    <div className="h-2 w-2 bg-primary rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-neutral-800">Configuration mise à jour</p>
                      <p className="text-xs text-neutral-500">Il y a 2 heures</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

  {/* Médecins et patients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card className="border-2 border-neutral-100">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg">
                  <BarChart2 className="h-5 w-5 text-primary-600" />
                </div>
                <span>Statistiques des médecins</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="py-6 text-center text-sm text-neutral-500">
                  Chargement des statistiques...
                </div>
              ) : doctorInsights.length === 0 ? (
                <div className="py-6 text-center text-sm text-neutral-500">
                  Aucune donnée disponible
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Médecin
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Rendez-vous
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Refus
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Annulations patients
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 bg-white">
                      {doctorInsights.map((insight) => {
                        const isDeleting = deletingUserIds.includes(insight.id);
                        return (
                          <tr key={insight.id} className="hover:bg-neutral-50">
                            <td className="px-4 py-3">
                              <div className="flex items-start space-x-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100">
                                  <UserIcon className="h-5 w-5 text-primary-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-neutral-800">{insight.fullName}</p>
                                  <p className="text-xs text-neutral-500">{insight.email || 'Non communiqué'}</p>
                                  {insight.specialization && (
                                    <p className="text-xs text-primary-600 mt-1">{insight.specialization}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-neutral-800">
                              {formatNumber(insight.totalAppointments)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-red-600">
                              {formatNumber(insight.refusals)}
                            </td>
                            <td className="px-4 py-3 text-sm text-neutral-700">
                              {formatNumber(insight.patientCancellations)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDeleteUser(insight.id, insight.fullName)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? 'Suppression...' : (
                                  <span className="inline-flex items-center">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </span>
                                )}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-neutral-100">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-lg">
                  <BarChart2 className="h-5 w-5 text-secondary-600" />
                </div>
                <span>Statistiques des patients</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="py-6 text-center text-sm text-neutral-500">
                  Chargement des statistiques...
                </div>
              ) : patientInsights.length === 0 ? (
                <div className="py-6 text-center text-sm text-neutral-500">
                  Aucune donnée disponible
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Patient
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Rendez-vous
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Annulations
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Terminés
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 bg-white">
                      {patientInsights.map((insight) => {
                        const isDeleting = deletingUserIds.includes(insight.id);
                        return (
                          <tr key={insight.id} className="hover:bg-neutral-50">
                            <td className="px-4 py-3">
                              <div className="flex items-start space-x-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-100">
                                  <UserIcon className="h-5 w-5 text-secondary-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-neutral-800">{insight.fullName}</p>
                                  <p className="text-xs text-neutral-500">{insight.email || 'Non communiqué'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-neutral-800">
                              {formatNumber(insight.totalAppointments)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-red-600">
                              {formatNumber(insight.cancellations)}
                            </td>
                            <td className="px-4 py-3 text-sm text-neutral-700">
                              {formatNumber(insight.completedAppointments)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDeleteUser(insight.id, insight.fullName)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? 'Suppression...' : (
                                  <span className="inline-flex items-center">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </span>
                                )}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Doctors by Specialization */}
          <Card className="border-2 border-neutral-100">
            <CardHeader>
              <CardTitle>Médecins par spécialité</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.doctorsBySpecialization).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.doctorsBySpecialization).map(([specialization, count]) => (
                    <div key={specialization} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{specialization}</span>
                      <span className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-4">Aucune donnée disponible</p>
              )}
            </CardContent>
          </Card>

          {/* Appointment Cancellations */}
          <Card className="border-2 border-neutral-100">
            <CardHeader>
              <CardTitle>Annulations de rendez-vous</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-semibold mb-1">Par les patients</p>
                      <p className="text-3xl font-bold text-blue-900">{stats.cancelledByPatient}</p>
                    </div>
                    <div className="p-3 bg-blue-200 rounded-xl">
                      <UserIcon className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-semibold mb-1">Par les médecins</p>
                      <p className="text-3xl font-bold text-green-900">{stats.cancelledByDoctor}</p>
                    </div>
                    <div className="p-3 bg-green-200 rounded-xl">
                      <UserCheck className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }
  return value.toLocaleString('fr-FR');
}

function extractItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object') {
    const items = (payload as { items?: unknown }).items;
    if (Array.isArray(items)) {
      return items as T[];
    }
  }

  return [];
}

function buildInsights(appointments: Appointment[]): { doctors: DoctorInsight[]; patients: PatientInsight[] } {
  const doctorMap = new Map<number, DoctorInsight>();
  const patientMap = new Map<number, PatientInsight>();

  for (const appointment of appointments) {
    const doctorId = appointment.doctor_id;
    const patientId = appointment.patient_id;
    const doctorInfo = appointment.doctor as UserType | undefined;
    const patientInfo = appointment.patient as UserType | undefined;

    if (!doctorMap.has(doctorId)) {
      doctorMap.set(doctorId, {
        id: doctorId,
        fullName: buildUserName(doctorInfo, doctorId, 'Dr.'),
        email: doctorInfo?.email ?? '',
        specialization: doctorInfo?.specialization,
        totalAppointments: 0,
        refusals: 0,
        patientCancellations: 0,
      });
    }

    if (!patientMap.has(patientId)) {
      patientMap.set(patientId, {
        id: patientId,
        fullName: buildUserName(patientInfo, patientId),
        email: patientInfo?.email ?? '',
        totalAppointments: 0,
        cancellations: 0,
        completedAppointments: 0,
      });
    }

    const doctorEntry = doctorMap.get(doctorId)!;
    doctorEntry.totalAppointments += 1;
    if (doctorInfo) {
      doctorEntry.fullName = buildUserName(doctorInfo, doctorId, 'Dr.');
      doctorEntry.email = doctorInfo.email;
      doctorEntry.specialization = doctorInfo.specialization;
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      if (appointment.cancelled_by === doctorId) {
        doctorEntry.refusals += 1;
      } else if (appointment.cancelled_by === patientId) {
        doctorEntry.patientCancellations += 1;
      }
    }

    const patientEntry = patientMap.get(patientId)!;
    patientEntry.totalAppointments += 1;
    if (patientInfo) {
      patientEntry.fullName = buildUserName(patientInfo, patientId);
      patientEntry.email = patientInfo.email;
    }

    if (appointment.status === AppointmentStatus.CANCELLED && appointment.cancelled_by === patientId) {
      patientEntry.cancellations += 1;
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      patientEntry.completedAppointments += 1;
    }
  }

  const doctors = Array.from(doctorMap.values())
    .sort((a, b) => {
      if (b.refusals !== a.refusals) {
        return b.refusals - a.refusals;
      }
      return b.totalAppointments - a.totalAppointments;
    })
    .slice(0, 8);

  const patients = Array.from(patientMap.values())
    .sort((a, b) => {
      if (b.cancellations !== a.cancellations) {
        return b.cancellations - a.cancellations;
      }
      return b.totalAppointments - a.totalAppointments;
    })
    .slice(0, 8);

  return { doctors, patients };
}

function buildUserName(user?: UserType, fallbackId?: number, prefix?: string): string {
  const firstName = user?.first_name?.trim() ?? '';
  const lastName = user?.last_name?.trim() ?? '';
  const baseName = [firstName, lastName].filter(Boolean).join(' ');

  if (baseName) {
    return prefix ? `${prefix} ${baseName}` : baseName;
  }

  if (prefix) {
    return fallbackId != null ? `${prefix} #${fallbackId}` : prefix;
  }

  if (fallbackId != null) {
    return `Utilisateur #${fallbackId}`;
  }

  return 'Utilisateur inconnu';
}
