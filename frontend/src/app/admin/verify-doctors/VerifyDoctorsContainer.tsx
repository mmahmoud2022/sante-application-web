/**
 * Admin Verify Doctors Container
 * Handles doctor approval workflow for administrators
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  LogOut,
  Bell,
  Shield,
  CheckCircle,
  XCircle,
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import logger from '@/lib/logger';

interface Doctor {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  specialization?: string;
  license_number?: string;
  experience_years?: number;
  bio?: string;
  is_verified: boolean;
  created_at: string;
}

export default function VerifyDoctorsContainer() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified'>('pending');
  const [loadingData, setLoadingData] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
      return;
    }

    if (user && user.role !== 'admin') {
      router.push('/login');
      return;
    }

    if (user) {
      loadDoctors();
    }
  }, [user, loading, router]);

  useEffect(() => {
    filterDoctorsList();
  }, [doctors, searchTerm, filterStatus]);

  const loadDoctors = async () => {
    try {
      const response = await api.users.doctors();
      const doctorsList = Array.isArray(response.data) ? response.data : (response.data as any).items || [];
      setDoctors(doctorsList);
    } catch (error: any) {
      logger.error(
        'Failed to load doctors',
        {
          userId: user?.id,
          role: user?.role,
          errorMessage: error?.message,
        },
        error
      );
    } finally {
      setLoadingData(false);
    }
  };

  const filterDoctorsList = () => {
    let filtered = [...doctors];

    if (filterStatus === 'pending') {
      filtered = filtered.filter((doc) => !doc.is_verified);
    } else if (filterStatus === 'verified') {
      filtered = filtered.filter((doc) => doc.is_verified);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.first_name.toLowerCase().includes(term) ||
          doc.last_name.toLowerCase().includes(term) ||
          doc.email.toLowerCase().includes(term) ||
          doc.specialization?.toLowerCase().includes(term) ||
          doc.license_number?.toLowerCase().includes(term)
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleVerifyDoctor = async (doctorId: number) => {
    setProcessingId(doctorId);
    try {
      await api.users.verify(doctorId);

      setDoctors((current) =>
        current.map((doc) => (doc.id === doctorId ? { ...doc, is_verified: true } : doc))
      );

      logger.info(
        'Doctor verified successfully',
        {
          adminId: user?.id,
          doctorId,
        }
      );
    } catch (error: any) {
      logger.error(
        'Failed to verify doctor',
        {
          adminId: user?.id,
          doctorId,
          errorMessage: error?.message,
        },
        error
      );
      alert('Erreur lors de la vérification du docteur');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectDoctor = async (doctorId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir rejeter ce docteur ? Cette action supprimera le compte.')) {
      return;
    }

    setProcessingId(doctorId);
    try {
      await api.users.delete(doctorId);

      setDoctors((current) => current.filter((doc) => doc.id !== doctorId));

      logger.info(
        'Doctor rejected and deleted',
        {
          adminId: user?.id,
          doctorId,
        }
      );
    } catch (error: any) {
      logger.error(
        'Failed to reject doctor',
        {
          adminId: user?.id,
          doctorId,
          errorMessage: error?.message,
        },
        error
      );
      alert('Erreur lors du rejet du docteur');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  const pendingCount = doctors.filter((d) => !d.is_verified).length;
  const verifiedCount = doctors.filter((d) => d.is_verified).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-neutral-900 dark:via-red-950 dark:to-orange-950">
      <header className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md shadow-lg border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-red-500 to-orange-500 p-2 rounded-xl shadow-lg">
                <Shield className="h-6 w-6 text-white" fill="white" />
              </div>
              <span className="text-2xl font-heading font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">Santé Admin</span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">| Vérification Docteurs</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2.5 text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                <Bell className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">Administrateur</p>
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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-neutral-800 dark:text-neutral-100 mb-2">
              Vérification des Comptes Docteurs 🩺
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Approuvez ou rejetez les demandes d'inscription des docteurs
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/dashboard')}
            className="inline-flex items-center justify-center gap-2 sm:w-auto"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-2 border-yellow-200 dark:border-yellow-700">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 font-semibold mb-1">En attente</p>
                  <p className="text-4xl font-bold text-yellow-900 dark:text-yellow-100">{pendingCount}</p>
                </div>
                <div className="p-3 bg-yellow-200 dark:bg-yellow-800 rounded-xl">
                  <User className="h-10 w-10 text-yellow-700" strokeWidth={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-700">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300 font-semibold mb-1">Vérifiés</p>
                  <p className="text-4xl font-bold text-green-900 dark:text-green-100">{verifiedCount}</p>
                </div>
                <div className="p-3 bg-green-200 dark:bg-green-800 rounded-xl">
                  <CheckCircle className="h-10 w-10 text-green-700" strokeWidth={2} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-700">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold mb-1">Total</p>
                  <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">{doctors.length}</p>
                </div>
                <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-xl">
                  <Heart className="h-10 w-10 text-blue-700" strokeWidth={2} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par nom, email, spécialisation..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${
                    filterStatus === 'all'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-2 border-neutral-300 dark:border-neutral-600 hover:border-red-300'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${
                    filterStatus === 'pending'
                      ? 'bg-yellow-500 text-white shadow-lg'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-2 border-neutral-300 dark:border-neutral-600 hover:border-yellow-300'
                  }`}
                >
                  En attente
                </button>
                <button
                  onClick={() => setFilterStatus('verified')}
                  className={`px-4 py-2.5 rounded-lg font-semibold transition-all ${
                    filterStatus === 'verified'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-2 border-neutral-300 dark:border-neutral-600 hover:border-green-300'
                  }`}
                >
                  Vérifiés
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liste des Docteurs ({filteredDoctors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                <p className="text-neutral-600 dark:text-neutral-400 mt-4">Chargement...</p>
              </div>
            ) : filteredDoctors.length > 0 ? (
              <div className="space-y-4">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className={`border-2 rounded-xl p-6 transition-all ${
                      doctor.is_verified
                        ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                        : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
                            Dr. {doctor.first_name} {doctor.last_name}
                          </h3>
                          {doctor.is_verified ? (
                            <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Vérifié
                            </span>
                          ) : (
                            <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full text-xs font-semibold">
                              En attente
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <Mail className="h-4 w-4" />
                            <span>{doctor.email}</span>
                          </div>
                          {doctor.phone && (
                            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                              <Phone className="h-4 w-4" />
                              <span>{doctor.phone}</span>
                            </div>
                          )}
                          {doctor.specialization && (
                            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                              <Award className="h-4 w-4" />
                              <span>{doctor.specialization}</span>
                            </div>
                          )}
                          {doctor.license_number && (
                            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                              <Shield className="h-4 w-4" />
                              <span>License: {doctor.license_number}</span>
                            </div>
                          )}
                          {doctor.experience_years && (
                            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                              <Calendar className="h-4 w-4" />
                              <span>{doctor.experience_years} ans d'expérience</span>
                            </div>
                          )}
                        </div>

                        {doctor.bio && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 italic mb-2">
                            &quot;{doctor.bio}&quot;
                          </p>
                        )}

                        <p className="text-xs text-neutral-500 dark:text-neutral-500">
                          Inscrit le {new Date(doctor.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>

                      {!doctor.is_verified && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleVerifyDoctor(doctor.id)}
                            disabled={processingId === doctor.id}
                            className="p-3 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-xl transition-all border-2 border-green-200 dark:border-green-700 hover:border-green-300 disabled:opacity-50"
                            title="Approuver"
                          >
                            {processingId === doctor.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                            ) : (
                              <CheckCircle className="h-6 w-6" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectDoctor(doctor.id)}
                            disabled={processingId === doctor.id}
                            className="p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all border-2 border-red-200 dark:border-red-700 hover:border-red-300 disabled:opacity-50"
                            title="Rejeter"
                          >
                            {processingId === doctor.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                            ) : (
                              <XCircle className="h-6 w-6" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <User className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-600 dark:text-neutral-400 text-lg font-semibold mb-2">
                  Aucun docteur trouvé
                </p>
                <p className="text-neutral-500 dark:text-neutral-500 text-sm">
                  {searchTerm ? 'Essayez un autre terme de recherche' : 'Aucune demande pour le moment'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
