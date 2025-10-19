/**
 * Admin Dashboard Page
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Calendar, DollarSign, Heart, LogOut, Bell,
  TrendingUp, Activity, Shield, Settings, UserCheck, AlertTriangle
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
      const [usersRes, appointmentsRes] = await Promise.all([
        api.users.list(),
        api.appointments.list(),
      ]);

      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const appointments = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : (appointmentsRes.data as any).items || [];

      const doctors = users.filter((u: any) => u.role === 'doctor');
      const patients = users.filter((u: any) => u.role === 'patient');
      const pendingDoctors = doctors.filter((d: any) => !d.is_verified);

      setStats({
        totalUsers: users.length,
        totalDoctors: doctors.length,
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        pendingVerifications: pendingDoctors.length,
        activeUsers: users.filter((u: any) => u.is_active).length,
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
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Heart className="h-8 w-8 text-primary" />
              <span className="text-2xl font-heading font-bold text-primary">Santé</span>
              <span className="text-sm text-neutral-500">| Administration</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-neutral-600 hover:text-primary transition-colors">
                <Bell className="h-6 w-6" />
                {stats.pendingVerifications > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-800">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-neutral-500">Administrateur</p>
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
            Tableau de bord administrateur 🛡️
          </h1>
          <p className="text-neutral-600">
            Vue d&apos;ensemble du système et des utilisateurs
          </p>
        </div>

        {/* Alert for pending verifications */}
        {stats.pendingVerifications > 0 && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
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
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium mb-1">Utilisateurs</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalUsers}</p>
                  <p className="text-xs text-blue-700 mt-1">
                    {stats.activeUsers} actifs
                  </p>
                </div>
                <Users className="h-12 w-12 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium mb-1">Médecins</p>
                  <p className="text-3xl font-bold text-green-900">{stats.totalDoctors}</p>
                  <p className="text-xs text-green-700 mt-1">
                    {stats.pendingVerifications} à vérifier
                  </p>
                </div>
                <UserCheck className="h-12 w-12 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium mb-1">Patients</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.totalPatients}</p>
                  <p className="text-xs text-purple-700 mt-1">Total inscrits</p>
                </div>
                <Heart className="h-12 w-12 text-purple-500 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium mb-1">Rendez-vous</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.totalAppointments}</p>
                  <p className="text-xs text-orange-700 mt-1">Total réservés</p>
                </div>
                <Calendar className="h-12 w-12 text-orange-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => router.push('/admin/users')}
                    className="p-6 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <Users className="h-8 w-8 text-primary mb-3" />
                    <h4 className="font-semibold text-neutral-800 mb-1">
                      Gérer les utilisateurs
                    </h4>
                    <p className="text-sm text-neutral-600">
                      Voir, vérifier et gérer tous les comptes
                    </p>
                  </button>

                  <button
                    onClick={() => router.push('/admin/content')}
                    className="p-6 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <Activity className="h-8 w-8 text-primary mb-3" />
                    <h4 className="font-semibold text-neutral-800 mb-1">
                      Gestion du contenu
                    </h4>
                    <p className="text-sm text-neutral-600">
                      Spécialisations, localités, annonces
                    </p>
                  </button>

                  <button
                    onClick={() => router.push('/admin/reports')}
                    className="p-6 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <TrendingUp className="h-8 w-8 text-primary mb-3" />
                    <h4 className="font-semibold text-neutral-800 mb-1">
                      Rapports et analytics
                    </h4>
                    <p className="text-sm text-neutral-600">
                      Statistiques et métriques détaillées
                    </p>
                  </button>

                  <button
                    onClick={() => router.push('/admin/settings')}
                    className="p-6 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <Settings className="h-8 w-8 text-primary mb-3" />
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-6 w-6 text-primary" />
                  <span>Santé du système</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-neutral-200">
                    <span className="text-sm text-neutral-600">Status API</span>
                    <span className="flex items-center text-green-600 font-semibold text-sm">
                      <div className="h-2 w-2 bg-green-600 rounded-full mr-2"></div>
                      Opérationnel
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-neutral-200">
                    <span className="text-sm text-neutral-600">Base de données</span>
                    <span className="flex items-center text-green-600 font-semibold text-sm">
                      <div className="h-2 w-2 bg-green-600 rounded-full mr-2"></div>
                      Connectée
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-neutral-600">Services</span>
                    <span className="flex items-center text-green-600 font-semibold text-sm">
                      <div className="h-2 w-2 bg-green-600 rounded-full mr-2"></div>
                      Actifs
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-6 w-6 text-primary" />
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
      </div>
    </div>
  );
}
