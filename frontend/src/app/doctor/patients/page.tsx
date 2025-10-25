/**
 * Doctor Patients Overview Page
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserCircle,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  Search,
  MapPin,
  Clock3,
  FileText,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import logger from '@/lib/logger';
import { DoctorPatientSummary } from '@/types';

export default function DoctorPatientsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [patients, setPatients] = useState<DoctorPatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.doctor.patients();
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.items || [];
      setPatients(data);
    } catch (error: any) {
      logger.error('Failed to load doctor patients', {
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
      void loadPatients();
    }
  }, [user, authLoading, router, loadPatients]);

  const filteredPatients = useMemo(() => {
    if (!searchTerm) {
      return patients;
    }

    const search = searchTerm.toLowerCase();
    return patients.filter((patient) => {
      return (
        patient.first_name.toLowerCase().includes(search) ||
        patient.last_name.toLowerCase().includes(search) ||
        patient.email.toLowerCase().includes(search)
      );
    });
  }, [patients, searchTerm]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-neutral-600">Chargement des patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-100 rounded-xl">
              <Users className="h-6 w-6 text-secondary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Mes patients</h1>
              <p className="text-sm text-neutral-500">Visualisez votre patientèle et leurs derniers rendez-vous</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/doctor/dashboard')}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Tableau de bord
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Total patients</p>
                <p className="text-2xl font-semibold text-neutral-900">{patients.length}</p>
              </div>
              <UserCircle className="h-8 w-8 text-secondary-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Consultations récentes</p>
                <p className="text-2xl font-semibold text-neutral-900">
                  {patients.filter((patient) => Boolean(patient.last_appointment_date)).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-secondary-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">Consultations à venir</p>
                <p className="text-2xl font-semibold text-neutral-900">
                  {patients.filter((patient) => Boolean(patient.next_appointment_date)).length}
                </p>
              </div>
              <Clock3 className="h-8 w-8 text-secondary-500" />
            </CardContent>
          </Card>
        </div>

        <Card className="border border-neutral-200">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg text-neutral-800">
              <Users className="h-5 w-5 text-secondary-600" /> Liste des patients
            </CardTitle>
            <div className="flex items-center gap-2 w-full md:w-80">
              <Search className="h-4 w-4 text-neutral-400 absolute ml-3" />
              <Input
                className="pl-9"
                placeholder="Rechercher par nom ou email"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPatients.length === 0 ? (
              <div className="py-12 text-center text-neutral-500">
                Aucun patient trouvé
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Dernière consultation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Prochain rendez-vous
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-100">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900">
                            {patient.first_name} {patient.last_name}
                          </div>
                          <div className="text-xs text-neutral-500">#{patient.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-neutral-400" />
                            {patient.email}
                          </div>
                          {patient.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-neutral-400" />
                              {patient.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {patient.last_appointment_date
                            ? new Date(patient.last_appointment_date).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {patient.next_appointment_date
                            ? new Date(patient.next_appointment_date).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/doctor/patients/${patient.id}`)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Dossier
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
