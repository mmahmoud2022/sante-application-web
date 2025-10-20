/**
 * Admin Dashboard Page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Calendar, DollarSign, Heart, LogOut, Bell,
  TrendingUp, Activity, Shield, Settings, UserCheck, AlertTriangle, User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import logger from '@/lib/logger';

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
      loadDashboardData();
    }
  }, [user, loading, router]);

  const loadDashboardData = async () => {
    try {
      const [userStatsRes, appointmentStatsRes] = await Promise.all([
        api.users.stats(),
        api.appointments.stats(),
      ]);

      const userStats = userStatsRes.data;
      const appointmentStats = appointmentStatsRes.data;

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
                  onClick={() => router.push('/admin/users')}
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
                  <p className="text-xs text-green-700 mt-1 font-medium">
                    {stats.pendingVerifications} à vérifier
                  </p>
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
                      <User className="h-8 w-8 text-blue-600" />
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
