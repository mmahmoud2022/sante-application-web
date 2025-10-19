/**
 * Prescription Management Page
 * Allows patients to view and manage their prescriptions
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Pill, 
  Calendar, 
  Clock, 
  User, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import api from '@/lib/api';
import { Prescription, PrescriptionStatus } from '@/types';

export default function PrescriptionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
      loadPrescriptions();
    }
  }, [user, authLoading, router]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.prescriptions.list();
      const prescriptionsList = Array.isArray(response.data) 
        ? response.data 
        : (response.data as any).items || [];
      
      setPrescriptions(prescriptionsList);
    } catch (error) {
      console.error('Failed to load prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewPrescription = async (prescriptionId: number) => {
    if (!confirm('Request to renew this prescription?')) {
      return;
    }

    try {
      await api.prescriptions.renew(prescriptionId);
      alert('Prescription renewal requested successfully!');
      loadPrescriptions();
    } catch (error: any) {
      console.error('Failed to renew prescription:', error);
      alert(error.response?.data?.detail || 'Failed to renew prescription');
    }
  };

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

  const calculateDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredPrescriptions = prescriptions.filter(prescription => 
    filterStatus === 'all' || prescription.status === filterStatus
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
              <p className="text-gray-600 mt-1">View and manage your prescriptions</p>
            </div>
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
                      Prescribed by: Dr. {selectedPrescription.doctor_id}
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
                        {new Date(selectedPrescription.start_date).toLocaleDateString()}
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

                  {/* Pharmacy Notes */}
                  {selectedPrescription.pharmacy_notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Pharmacy Notes</label>
                      <p className="text-gray-900 mt-1">{selectedPrescription.pharmacy_notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                      Close
                    </Button>
                    {selectedPrescription.status === 'active' && selectedPrescription.refills_remaining > 0 && (
                      <Button onClick={() => {
                        setShowDetailsModal(false);
                        handleRenewPrescription(selectedPrescription.id);
                      }}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Request Refill
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
                <div className="p-3 bg-orange-100 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Refills Available</p>
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
                  <p className="text-sm text-gray-600">Expiring Soon</p>
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
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-48"
          >
            <option value="all">All Prescriptions</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>

        {/* Prescriptions List */}
        {filteredPrescriptions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {filterStatus === 'all' 
                  ? 'No prescriptions found' 
                  : `No ${filterStatus} prescriptions`}
              </p>
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
                              Expiring in {daysRemaining} days
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
                            <p className="text-sm text-gray-600">Frequency</p>
                            <p className="font-medium text-gray-900">{prescription.frequency}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Duration</p>
                            <p className="font-medium text-gray-900">{prescription.duration_days} days</p>
                          </div>
                        </div>

                        {/* Instructions */}
                        {prescription.instructions && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Instructions:</span> {prescription.instructions}
                            </p>
                          </div>
                        )}

                        {/* Footer Info */}
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Started: {new Date(prescription.start_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <RefreshCw className="w-4 h-4 mr-1" />
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
                        {prescription.status === 'active' && prescription.refills_remaining > 0 && (
                          <Button 
                            size="sm" 
                            onClick={() => handleRenewPrescription(prescription.id)}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Request Refill
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
