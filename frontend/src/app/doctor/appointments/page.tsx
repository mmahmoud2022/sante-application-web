/**
 * Doctor Appointments Management Page
 * Comprehensive appointment management for doctors
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, User, Phone, Mail, MapPin,
  CheckCircle, XCircle, FileText, Video, Home,
  AlertCircle, ChevronLeft, ChevronRight, Filter,
  Search, Download, Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

interface Appointment {
  id: number;
  patient_id: number;
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
  date: string;
  time: string;
  appointment_type: string;
  status: string;
  chief_complaint?: string;
  notes?: string;
  diagnosis?: string;
  prescription?: string;
  created_at: string;
}

type AppointmentStatus = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
type AppointmentType = 'all' | 'in-person' | 'video' | 'home';

export default function DoctorAppointmentsPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus>('all');
  const [typeFilter, setTypeFilter] = useState<AppointmentType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Diagnosis form
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
    today: 0,
  });

  const calculateStats = useCallback((appts: Appointment[]) => {
    const today = new Date().toISOString().split('T')[0];
    setStats({
      pending: appts.filter(a => a.status === 'pending').length,
      confirmed: appts.filter(a => a.status === 'confirmed').length,
      completed: appts.filter(a => a.status === 'completed').length,
      today: appts.filter(a => a.date === today).length,
    });
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await api.appointments.list();
      const appts = response.data || [];
      setAppointments(appts);
      calculateStats(appts);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoadingData(false);
    }
  }, [calculateStats]);

  const filterAppointments = useCallback(() => {
    let filtered = [...appointments];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(a => a.appointment_type === typeFilter);
    }

    // Date filter
    const today = new Date();
    if (dateFilter === 'today') {
      const todayStr = today.toISOString().split('T')[0];
      filtered = filtered.filter(a => a.date === todayStr);
    } else if (dateFilter === 'week') {
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(a => {
        const apptDate = new Date(a.date);
        return apptDate >= today && apptDate <= weekFromNow;
      });
    } else if (dateFilter === 'month') {
      const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(a => {
        const apptDate = new Date(a.date);
        return apptDate >= today && apptDate <= monthFromNow;
      });
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.patient_name?.toLowerCase().includes(search) ||
        a.patient_email?.toLowerCase().includes(search) ||
        a.chief_complaint?.toLowerCase().includes(search)
      );
    }

    setFilteredAppointments(filtered);
  }, [appointments, statusFilter, typeFilter, dateFilter, searchTerm]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'doctor') {
      router.push('/login');
      return;
    }

    if (user) {
      void loadAppointments();
    }
  }, [user, loading, router, loadAppointments]);

  useEffect(() => {
    filterAppointments();
  }, [filterAppointments]);

  const handleConfirmAppointment = async (appointmentId: number) => {
    try {
      await api.appointments.update(appointmentId, { status: 'confirmed' });
      await loadAppointments();
    } catch (error) {
      console.error('Failed to confirm appointment:', error);
      alert('Erreur lors de la confirmation du rendez-vous');
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous?')) {
      return;
    }

    try {
      await api.appointments.cancel(appointmentId);
      await loadAppointments();
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      alert('Erreur lors de l\'annulation du rendez-vous');
    }
  };

  const handleOpenDiagnosisModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDiagnosis(appointment.diagnosis || '');
    setPrescription(appointment.prescription || '');
    setNotes(appointment.notes || '');
    setShowDiagnosisModal(true);
  };

  const handleSaveDiagnosis = async () => {
    if (!selectedAppointment) return;

    setSavingDiagnosis(true);
    try {
      await api.appointments.update(selectedAppointment.id, {
        status: 'completed',
        diagnosis,
        prescription,
        notes,
      });
      await loadAppointments();
      setShowDiagnosisModal(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Failed to save diagnosis:', error);
      alert('Erreur lors de l\'enregistrement du diagnostic');
    } finally {
      setSavingDiagnosis(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5" />;
      case 'home': return <Home className="h-5 w-5" />;
      default: return <User className="h-5 w-5" />;
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des rendez-vous</h1>
              <p className="text-gray-600">Gérez vos consultations</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/doctor/dashboard')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Tableau de bord
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aujourd'hui</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confirmés</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Terminés</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un patient..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmés</option>
                <option value="completed">Terminés</option>
                <option value="cancelled">Annulés</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as AppointmentType)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">Tous les types</option>
                <option value="in-person">Sur place</option>
                <option value="video">Vidéo</option>
                <option value="home">À domicile</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Rendez-vous ({filteredAppointments.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun rendez-vous trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getTypeIcon(appointment.appointment_type)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {appointment.patient_name || 'Patient'}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(appointment.date).toLocaleDateString('fr-FR')}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {appointment.time}
                              </span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(appointment.status)}`}>
                            {appointment.status === 'pending' ? 'En attente' :
                             appointment.status === 'confirmed' ? 'Confirmé' :
                             appointment.status === 'completed' ? 'Terminé' : 'Annulé'}
                          </span>
                        </div>

                        {appointment.chief_complaint && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600">
                              <strong>Motif:</strong> {appointment.chief_complaint}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          {appointment.patient_email && (
                            <span className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {appointment.patient_email}
                            </span>
                          )}
                          {appointment.patient_phone && (
                            <span className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {appointment.patient_phone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        {appointment.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleConfirmAppointment(appointment.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirmer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelAppointment(appointment.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Annuler
                            </Button>
                          </>
                        )}
                        {appointment.status === 'confirmed' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleOpenDiagnosisModal(appointment)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Ajouter diagnostic
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelAppointment(appointment.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Annuler
                            </Button>
                          </>
                        )}
                        {appointment.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir détails
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diagnosis Modal */}
      {showDiagnosisModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Ajouter un diagnostic</h2>
              <p className="text-gray-600">Patient: {selectedAppointment.patient_name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnostic
                </label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Entrez le diagnostic..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prescription / Ordonnance
                </label>
                <textarea
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Médicaments et dosages..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes / Recommandations
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Notes supplémentaires..."
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDiagnosisModal(false);
                  setSelectedAppointment(null);
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveDiagnosis}
                loading={savingDiagnosis}
              >
                Enregistrer et terminer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Détails du rendez-vous</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Informations patient</h3>
                <p><strong>Nom:</strong> {selectedAppointment.patient_name}</p>
                <p><strong>Email:</strong> {selectedAppointment.patient_email}</p>
                <p><strong>Téléphone:</strong> {selectedAppointment.patient_phone}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Rendez-vous</h3>
                <p><strong>Date:</strong> {new Date(selectedAppointment.date).toLocaleDateString('fr-FR')}</p>
                <p><strong>Heure:</strong> {selectedAppointment.time}</p>
                <p><strong>Type:</strong> {selectedAppointment.appointment_type}</p>
              </div>
              {selectedAppointment.chief_complaint && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Motif</h3>
                  <p>{selectedAppointment.chief_complaint}</p>
                </div>
              )}
              {selectedAppointment.diagnosis && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Diagnostic</h3>
                  <p>{selectedAppointment.diagnosis}</p>
                </div>
              )}
              {selectedAppointment.prescription && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Ordonnance</h3>
                  <p className="whitespace-pre-wrap">{selectedAppointment.prescription}</p>
                </div>
              )}
              {selectedAppointment.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="whitespace-pre-wrap">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedAppointment(null);
                }}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
