/**
 * Doctor Prescriptions Management Page
 * Allows doctors to view and create prescriptions for patients
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Pill,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import api from '@/lib/api';
import logger from '@/lib/logger';
import { Prescription, PrescriptionStatus } from '@/types';

const formatDateLabel = (value?: string | null) => {
  if (!value) {
    return 'Non renseignée';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Non renseignée';
  }

  return date.toLocaleDateString();
};

export default function DoctorPrescriptionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  // Group prescriptions by patient
  const prescriptionsByPatient = prescriptions.reduce((acc, prescription) => {
    const patientId = prescription.patient_id;
    if (!acc[patientId]) {
      acc[patientId] = [];
    }
    acc[patientId].push(prescription);
    return acc;
  }, {} as Record<number, Prescription[]>);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const loadPrescriptions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.prescriptions.list({ doctor_id: user?.id });
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
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'doctor') {
      router.push('/login');
      return;
    }

    if (user) {
      void loadPrescriptions();
    }
  }, [user, authLoading, router, loadPrescriptions]);

  const handleViewDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: PrescriptionStatus) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };

    const icons = {
      active: CheckCircle,
      completed: CheckCircle,
      cancelled: XCircle,
      expired: AlertCircle,
    };

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    const matchesStatus = filterStatus === 'all' || prescription.status === filterStatus;
    const matchesSearch = !searchTerm ||
      prescription.medication_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading prescriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 shadow-sm border-b dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Prescriptions</h1>
              <p className="text-gray-600 dark:text-neutral-400 mt-1">Manage patient prescriptions</p>
            </div>
            <Button onClick={() => router.push('/doctor/prescriptions/create')}>
              <Plus className="w-5 h-5 mr-2" />
              New Prescription
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
                  <CardTitle>Prescription Details</CardTitle>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Header Info */}
                  <div className="border-b pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedPrescription.medication_name}
                      </h3>
                      {getStatusBadge(selectedPrescription.status)}
                    </div>
                    <p className="text-gray-600">
                      Patient ID: {selectedPrescription.patient_id}
                    </p>
                  </div>

                  {/* Dosage Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Dosage</label>
                      <p className="text-gray-900 font-medium">{selectedPrescription.dosage}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Frequency</label>
                      <p className="text-gray-900 font-medium">{selectedPrescription.frequency}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Duration</label>
                      <p className="text-gray-900 font-medium">{selectedPrescription.duration_days} days</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Start Date</label>
                      <p className="text-gray-900 font-medium">
                        {formatDateLabel(selectedPrescription.start_date)}
                      </p>
                    </div>
                  </div>

                  {/* Instructions */}
                  {selectedPrescription.instructions && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Instructions</label>
                      <p className="text-gray-900 mt-1 p-3 bg-blue-50 rounded-lg">
                        {selectedPrescription.instructions}
                      </p>
                    </div>
                  )}

                  {/* Refills */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Refills Allowed</label>
                      <p className="text-gray-900 font-medium">{selectedPrescription.refills_allowed}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Refills Remaining</label>
                      <p className="text-gray-900 font-medium">{selectedPrescription.refills_remaining}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Auto-Renewal</label>
                      <p className="text-gray-900 font-medium">
                        {selectedPrescription.auto_renewal_enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                      Close
                    </Button>
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
                  <p className="text-sm text-gray-600">Active</p>
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
                  <p className="text-sm text-gray-600">Completed</p>
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
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {prescriptions.filter(p => {
                      const timestamp = p.created_at ?? p.start_date;
                      if (!timestamp) {
                        return false;
                      }

                      const date = new Date(timestamp);
                      if (Number.isNaN(date.getTime())) {
                        return false;
                      }

                      const now = new Date();
                      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Unique Patients</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(prescriptions.map(p => p.patient_id)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by medication name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-48"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        </div>

        {/* Prescriptions List */}
        {filteredPrescriptions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all'
                  ? 'No prescriptions match your filters'
                  : 'No prescriptions created yet'}
              </p>
              <Button onClick={() => router.push('/doctor/prescriptions/create')} className="mt-4">
                Create Your First Prescription
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPrescriptions.map(prescription => (
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
                      </div>

                      {/* Patient Info */}
                      <div className="flex items-center text-gray-700 mb-3">
                        <User className="w-4 h-4 mr-2" />
                        <span className="font-medium">
                          Patient ID: {prescription.patient_id}
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Dosage</p>
                          <p className="font-medium text-gray-900">{prescription.dosage}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Frequency</p>
                          <p className="font-medium text-gray-900">{prescription.frequency}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Duration</p>
                          <p className="font-medium text-gray-900">{prescription.duration_days} days</p>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Started: {formatDateLabel(prescription.start_date)}</span>
                        </div>
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-1" />
                          <span>{prescription.refills_remaining} refills remaining</span>
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
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
