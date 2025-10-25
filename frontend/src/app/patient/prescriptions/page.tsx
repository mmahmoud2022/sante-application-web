/**
 * Prescription Management Page
 * Allows patients to view and manage their prescriptions
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Pill,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import api from '@/lib/api';
import logger from '@/lib/logger';
import { Prescription, PrescriptionStatus } from '@/types';

const STATUS_BADGE_LABELS: Record<PrescriptionStatus, string> = {
  active: 'Active',
  completed: 'Terminée',
  cancelled: 'Annulée',
  expired: 'Expirée',
};

const FILTER_OPTION_LABELS: Record<'all' | PrescriptionStatus, string> = {
  all: 'Toutes les ordonnances',
  active: 'Actives',
  completed: 'Terminées',
  expired: 'Expirées',
  cancelled: 'Annulées',
};

const EMPTY_STATE_STATUS_LABELS: Record<PrescriptionStatus, string> = {
  active: 'actives',
  completed: 'terminées',
  expired: 'expirées',
  cancelled: 'annulées',
};

export default function PrescriptionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | PrescriptionStatus>('all');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const loadPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.prescriptions.list();
      const prescriptionsList = Array.isArray(response.data) 
        ? response.data 
        : (response.data as any).items || [];
      
      setPrescriptions(prescriptionsList);
    } catch (error: any) {
      logger.error('Failed to load prescriptions', {
        userId: user?.id,
        errorMessage: error?.message,
      }, error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'patient') {
      router.push('/login');
      return;
    }

    if (user) {
      void loadPrescriptions();
    }
  }, [user, authLoading, router, loadPrescriptions]);

  const handleRenewPrescription = async (prescriptionId: number) => {
    if (!confirm('Souhaitez-vous demander le renouvellement de cette ordonnance ?')) {
      return;
    }

    try {
  await api.prescriptions.renew(prescriptionId);
  alert('Renouvellement demandé avec succès !');
  await loadPrescriptions();
    } catch (error: any) {
      logger.error('Failed to renew prescription', {
        userId: user?.id,
        prescriptionId,
        errorMessage: error?.message,
      }, error);
      alert(error.response?.data?.detail || "Impossible de renouveler l'ordonnance");
    }
  };

  const handleViewDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: PrescriptionStatus) => {
    const styles: Record<PrescriptionStatus, string> = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };

    const icons: Record<PrescriptionStatus, typeof CheckCircle> = {
      active: CheckCircle,
      completed: CheckCircle,
      cancelled: XCircle,
      expired: AlertCircle,
    };

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {STATUS_BADGE_LABELS[status]}
      </span>
    );
  };

  const calculateDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Non renseignée';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDuration = (days: number) => {
    if (!Number.isFinite(days)) return 'Non renseignée';
    return days > 1 ? `${days} jours` : `${days} jour`;
  };

  const getDaysRemainingLabel = (days: number) => {
    return days === 1 ? 'Expire dans 1 jour' : `Expire dans ${days} jours`;
  };

  const filteredPrescriptions = prescriptions.filter(prescription => 
    filterStatus === 'all' || prescription.status === filterStatus
  );

  const emptyStateMessage =
    filterStatus === 'all'
      ? 'Aucune ordonnance disponible pour le moment.'
      : `Aucune ordonnance ${EMPTY_STATE_STATUS_LABELS[filterStatus]}.`;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mes ordonnances</h1>
              <p className="text-gray-600 mt-1">Consultez et gérez vos ordonnances</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/patient/dashboard')}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Details Modal */}
        {showDetailsModal && selectedPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Détails de l'ordonnance</CardTitle>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <span className="sr-only">Fermer la fenêtre</span>
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedPrescription.medication_name}
                      </h3>
                      {getStatusBadge(selectedPrescription.status)}
                    </div>
                    <p className="text-gray-600">
                      Prescrite par : Dr {selectedPrescription.doctor_id}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Début : {formatDate(selectedPrescription.start_date)} | Fin : {formatDate(selectedPrescription.end_date)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Dosage</label>
                      <p className="text-gray-900 font-medium">{selectedPrescription.dosage}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fréquence</label>
                      <p className="text-gray-900 font-medium">{selectedPrescription.frequency}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Durée</label>
                      <p className="text-gray-900 font-medium">{formatDuration(selectedPrescription.duration_days)}</p>
                    </div>
                    {typeof selectedPrescription.quantity === 'number' && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Quantité</label>
                        <p className="text-gray-900 font-medium">{selectedPrescription.quantity}</p>
                      </div>
                    )}
                  </div>

                  {selectedPrescription.instructions && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Consignes</label>
                      <p className="text-gray-900 mt-1 p-3 bg-blue-50 rounded-lg">
                        {selectedPrescription.instructions}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Renouvellements autorisés</label>
                      <p className="text-gray-900 font-medium">{selectedPrescription.refills_allowed}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Renouvellements restants</label>
                      <p className="text-gray-900 font-medium">{selectedPrescription.refills_remaining}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Renouvellement automatique</label>
                      <p className="text-gray-900 font-medium">
                        {selectedPrescription.auto_renewal_enabled ? 'Activé' : 'Désactivé'}
                      </p>
                    </div>
                  </div>

                  {selectedPrescription.pharmacy_notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Notes de la pharmacie</label>
                      <p className="text-gray-900 mt-1">{selectedPrescription.pharmacy_notes}</p>
                    </div>
                  )}

                  {selectedPrescription.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Notes du médecin</label>
                      <p className="text-gray-900 mt-1">{selectedPrescription.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                      Fermer
                    </Button>
                    {selectedPrescription.status === 'active' && selectedPrescription.refills_remaining > 0 && (
                      <Button
                        onClick={() => {
                          setShowDetailsModal(false);
                          handleRenewPrescription(selectedPrescription.id);
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Demander un renouvellement
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Pill className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Actives</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {prescriptions.filter(p => p.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Terminées</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {prescriptions.filter(p => p.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Renouvellements disponibles</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {prescriptions.reduce((sum, p) => sum + p.refills_remaining, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Expiration proche</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {prescriptions.filter(p => {
                      const days = calculateDaysRemaining(p.end_date);
                      return days !== null && days > 0 && days <= 7;
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-4 mb-6">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600">Filtrer par statut</span>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | PrescriptionStatus)}
            className="w-56"
          >
            {Object.entries(FILTER_OPTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        {/* Prescriptions List */}
        {filteredPrescriptions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{emptyStateMessage}</p>
              {filterStatus === 'all' && (
                <Button
                  className="mt-4"
                  onClick={() => router.push('/patient/book-appointment')}
                >
                  Réservez votre premier rendez-vous
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPrescriptions.map(prescription => {
              const daysRemaining = calculateDaysRemaining(prescription.end_date);
              const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7;

              return (
                <Card key={prescription.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-bold text-gray-900">
                            {prescription.medication_name}
                          </h3>
                          {getStatusBadge(prescription.status)}
                          {isExpiringSoon && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {daysRemaining !== null ? getDaysRemainingLabel(daysRemaining) : ''}
                            </span>
                          )}
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Dosage</p>
                            <p className="font-medium text-gray-900">{prescription.dosage}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Fréquence</p>
                            <p className="font-medium text-gray-900">{prescription.frequency}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Durée</p>
                            <p className="font-medium text-gray-900">{formatDuration(prescription.duration_days)}</p>
                          </div>
                        </div>

                        {/* Instructions */}
                        {prescription.instructions && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Consignes :</span> {prescription.instructions}
                            </p>
                          </div>
                        )}

                        {/* Footer Info */}
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>
                              Début : {formatDate(prescription.start_date)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <RefreshCw className="w-4 h-4 mr-1" />
                            <span>
                              {prescription.refills_remaining} renouvellement{prescription.refills_remaining > 1 ? 's' : ''} restant{prescription.refills_remaining > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetails(prescription)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir les détails
                        </Button>
                        {prescription.status === 'active' && prescription.refills_remaining > 0 && (
                          <Button 
                            size="sm" 
                            onClick={() => handleRenewPrescription(prescription.id)}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Demander un renouvellement
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
