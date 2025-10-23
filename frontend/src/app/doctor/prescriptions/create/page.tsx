/**
 * Create Electronic Prescription Page
 * Allows doctors to create new prescriptions for their patients
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Pill,
  User,
  Calendar,
  FileText,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import api from '@/lib/api';
import logger from '@/lib/logger';
import { DoctorPatientSummary } from '@/types';

interface Medication {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions: string;
  file: File | null;
}

export default function CreatePrescriptionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [patients, setPatients] = useState<DoctorPatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: '1',
      medication_name: '',
      dosage: '',
      frequency: '',
      duration_days: 7,
      instructions: '',
      file: null,
    },
  ]);
  const [refillsAllowed, setRefillsAllowed] = useState(0);
  const [autoRenewal, setAutoRenewal] = useState(false);
  const [pharmacyNotes, setPharmacyNotes] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      loadPatients();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const patientId = searchParams.get('patient_id');
    if (patientId) {
      setSelectedPatientId(Number(patientId));
    }
  }, [searchParams]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await api.doctor.patients();
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.items || [];
      setPatients(data);
    } catch (error: any) {
      logger.error('Failed to load patients', {
        userId: user?.id,
        errorMessage: error?.message,
      }, error);
      setMessage({ type: 'error', text: 'Failed to load patients list' });
    } finally {
      setLoading(false);
    }
  };

  const addMedication = () => {
    const newId = String(Date.now());
    setMedications([
      ...medications,
      {
        id: newId,
        medication_name: '',
        dosage: '',
        frequency: '',
        duration_days: 7,
        instructions: '',
        file: null,
      },
    ]);
  };

  const removeMedication = (id: string) => {
    if (medications.length === 1) {
      setMessage({ type: 'error', text: 'At least one medication is required' });
      return;
    }
    setMedications(medications.filter(med => med.id !== id));
  };

  const updateMedication = (id: string, field: keyof Medication, value: any) => {
    setMedications(medications.map(med =>
      med.id === id ? { ...med, [field]: value } : med
    ));
  };

  const validateForm = (): boolean => {
    if (!selectedPatientId) {
      setMessage({ type: 'error', text: 'Please select a patient' });
      return false;
    }

    for (const med of medications) {
      if (!med.medication_name || !med.dosage || !med.frequency) {
        setMessage({ type: 'error', text: 'Please fill in all medication fields' });
        return false;
      }
      if (med.duration_days < 1) {
        setMessage({ type: 'error', text: 'Duration must be at least 1 day' });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      // Create each medication as a separate prescription
      const today = new Date().toISOString().split('T')[0];

      const prescriptionPromises = medications.map(med => {
        const payload = {
          patient_id: selectedPatientId,
          medication_name: med.medication_name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration_days: med.duration_days,
          instructions: med.instructions || undefined,
          refills_allowed: refillsAllowed,
          auto_renewal_enabled: autoRenewal,
          notes: pharmacyNotes || undefined,
          start_date: today,
        };

        if (med.file) {
          return api.prescriptions.upload(med.file, payload);
        }

        return api.prescriptions.create(payload);
      });

      await Promise.all(prescriptionPromises);

      setMessage({
        type: 'success',
        text: `Successfully created ${medications.length} prescription(s)!`,
      });

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/doctor/prescriptions');
      }, 1500);
    } catch (error: any) {
      logger.error('Failed to create prescription', {
        userId: user?.id,
        patientId: selectedPatientId,
        errorMessage: error?.message,
      }, error);
      setMessage({
        type: 'error',
        text: error?.response?.data?.detail || 'Failed to create prescription',
      });
    } finally {
      setSubmitting(false);
    }
  };

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

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100">
                <Pill className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Electronic Prescription</h1>
                <p className="text-sm text-gray-600 mt-1">Fill in the prescription details below</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push('/doctor/prescriptions')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 rounded-lg px-4 py-3 flex items-center gap-2 shadow-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Patient Selection */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Patient *
                  </label>
                  <Select
                    value={selectedPatientId || ''}
                    onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                  >
                    <option value="">Choose a patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} - {patient.email}
                      </option>
                    ))}
                  </Select>
                </div>

                {selectedPatient && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <p className="font-medium text-gray-900">
                          {selectedPatient.first_name} {selectedPatient.last_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <p className="font-medium text-gray-900">{selectedPatient.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <p className="font-medium text-gray-900">{selectedPatient.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Visit:</span>
                        <p className="font-medium text-gray-900">
                          {selectedPatient.last_appointment_date
                            ? new Date(selectedPatient.last_appointment_date).toLocaleDateString()
                            : 'No previous visits'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Medications */}
          <Card className="border border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-green-600" />
                  Medications
                </CardTitle>
                <Button size="sm" onClick={addMedication} variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Medication
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {medications.map((med, index) => (
                  <div key={med.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">Medication #{index + 1}</h4>
                      {medications.length > 1 && (
                        <button
                          onClick={() => removeMedication(med.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Medication Name *
                        </label>
                        <Input
                          value={med.medication_name}
                          onChange={(e) => updateMedication(med.id, 'medication_name', e.target.value)}
                          placeholder="e.g., Amoxicillin"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Dosage *
                        </label>
                        <Input
                          value={med.dosage}
                          onChange={(e) => updateMedication(med.id, 'dosage', e.target.value)}
                          placeholder="e.g., 500mg"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Frequency *
                        </label>
                        <Select
                          value={med.frequency}
                          onChange={(e) => updateMedication(med.id, 'frequency', e.target.value)}
                        >
                          <option value="">Select frequency</option>
                          <option value="Once daily">Once daily</option>
                          <option value="Twice daily">Twice daily</option>
                          <option value="Three times daily">Three times daily</option>
                          <option value="Four times daily">Four times daily</option>
                          <option value="Every 4 hours">Every 4 hours</option>
                          <option value="Every 6 hours">Every 6 hours</option>
                          <option value="Every 8 hours">Every 8 hours</option>
                          <option value="Every 12 hours">Every 12 hours</option>
                          <option value="As needed">As needed</option>
                          <option value="Before meals">Before meals</option>
                          <option value="After meals">After meals</option>
                          <option value="At bedtime">At bedtime</option>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Duration (days) *
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          value={med.duration_days}
                          onChange={(e) =>
                            updateMedication(med.id, 'duration_days', Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Instructions
                        </label>
                        <textarea
                          value={med.instructions}
                          onChange={(e) => updateMedication(med.id, 'instructions', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          rows={2}
                          placeholder="Additional instructions for taking this medication"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Attach Prescription Document (optional)
                        </label>
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={(e) => updateMedication(med.id, 'file', e.target.files?.[0] || null)}
                          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {med.file && (
                          <p className="mt-1 text-xs text-gray-600">Selected: {med.file.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Settings */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Additional Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Refills Allowed
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="12"
                    value={refillsAllowed}
                    onChange={(e) => setRefillsAllowed(Number(e.target.value))}
                  />
                </div>

                <div className="flex items-center">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRenewal}
                      onChange={(e) => setAutoRenewal(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-200"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Auto-Renewal</span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Pharmacy Notes
                  </label>
                  <textarea
                    value={pharmacyNotes}
                    onChange={(e) => setPharmacyNotes(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    rows={3}
                    placeholder="Notes for the pharmacist (optional)"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Electronic Signature */}
          <Card className="border border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Electronic Signature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  By submitting this prescription, you certify that:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                  <li>You have examined the patient and reviewed their medical history</li>
                  <li>The prescribed medications are medically necessary and appropriate</li>
                  <li>You have explained the treatment plan and potential side effects to the patient</li>
                  <li>This prescription complies with all applicable laws and regulations</li>
                </ul>
                <div className="p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-gray-900">
                    Prescribing Physician: Dr. {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    License: {user?.license_number || 'N/A'} | Date: {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/doctor/prescriptions')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedPatientId}
              loading={submitting}
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting ? 'Creating Prescription...' : 'Create Prescription'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
