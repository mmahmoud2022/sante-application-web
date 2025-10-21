/**
 * Quick appointment booking flow for patients
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  Stethoscope,
  User,
  Video,
  Building2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import api from '@/lib/api';
import logger from '@/lib/logger';
import {
  AppointmentBookingContext,
  AppointmentBookingDoctorSummary,
  AppointmentSlot,
  AppointmentType,
} from '@/types';

export default function PatientBookAppointmentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [context, setContext] = useState<AppointmentBookingContext>({ doctors: [] });
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>(AppointmentType.IN_PERSON);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const queryDoctor = useMemo(() => {
    const value = searchParams.get('doctor');
    if (!value) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }, [searchParams]);

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
      const defaultDate = new Date().toISOString().split('T')[0];
      setSelectedDate(defaultDate);
      loadContext(queryDoctor, defaultDate);
    }
  }, [user, authLoading, router, queryDoctor]);

  const loadContext = async (doctorId?: number | null, date?: string | null) => {
    try {
      setLoading(true);
      const response = await api.patient.bookAppointmentContext({
        doctor: doctorId ?? undefined,
        date: date ?? undefined,
      });
      const data: AppointmentBookingContext = response.data;
      setContext(data);
      setSelectedDoctorId(data.selected_doctor?.id ?? doctorId ?? null);
      if (date) {
        setSelectedDate(date);
      }
      if (data.available_slots && data.available_slots.length > 0) {
        setSelectedSlot(data.available_slots[0].time);
      } else {
        setSelectedSlot('');
      }
    } catch (error: any) {
      logger.error('Failed to load appointment booking context', {
        userId: user?.id,
        doctorId,
        date,
        errorMessage: error?.message,
      }, error);
      setMessage({
        type: 'error',
        text: 'Impossible de récupérer les données de réservation. Veuillez réessayer.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const doctorId = value ? Number(value) : null;
    setSelectedDoctorId(doctorId);
    setSelectedSlot('');
    if (doctorId) {
      loadContext(doctorId, selectedDate || undefined);
    }
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSelectedDate(value);
    if (selectedDoctorId) {
      loadContext(selectedDoctorId, value);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctorId || !selectedDate || !selectedSlot || !chiefComplaint) {
      setMessage({ type: 'error', text: 'Veuillez compléter les informations obligatoires.' });
      return;
    }

    setBooking(true);
    setMessage(null);

    try {
      await api.appointments.create({
        doctor_id: selectedDoctorId,
        appointment_date: selectedDate,
        appointment_time: selectedSlot,
        appointment_type: appointmentType,
        chief_complaint: chiefComplaint,
        notes: notes || undefined,
      });

      setMessage({ type: 'success', text: 'Votre rendez-vous a été réservé avec succès !' });
      setChiefComplaint('');
      setNotes('');

      setTimeout(() => {
        router.push('/patient/appointments');
      }, 1200);
    } catch (error: any) {
      logger.error('Failed to book appointment', {
        userId: user?.id,
        doctorId: selectedDoctorId,
        date: selectedDate,
        slot: selectedSlot,
        errorMessage: error?.message,
      }, error);
      setMessage({
        type: 'error',
        text: error?.response?.data?.detail || 'La réservation a échoué. Merci de réessayer.',
      });
    } finally {
      setBooking(false);
    }
  };

  const selectedDoctor: AppointmentBookingDoctorSummary | undefined = useMemo(() => {
    if (!selectedDoctorId) return undefined;
    if (context.selected_doctor && context.selected_doctor.id === selectedDoctorId) {
      return context.selected_doctor;
    }
    return context.doctors.find((doctor) => doctor.id === selectedDoctorId);
  }, [context, selectedDoctorId]);

  const availableSlots: AppointmentSlot[] = context.available_slots ?? [];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-neutral-600">Chargement de l'assistant de réservation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-100">
              <CalendarIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Réserver un rendez-vous</h1>
              <p className="text-sm text-neutral-500">
                Choisissez un médecin, une date et un créneau pour confirmer votre consultation
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/patient/appointments')}>
            Mes rendez-vous
          </Button>
        </header>

        {message && (
          <div
            className={`rounded-lg px-4 py-3 flex items-center gap-2 shadow-sm ${
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border border-neutral-200">
            <CardHeader>
              <CardTitle className="text-lg text-neutral-800 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary-600" />
                Selection du rendez-vous
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-600 mb-1 block">Choisir un médecin</label>
                <Select value={selectedDoctorId ?? ''} onChange={handleDoctorChange}>
                  <option value="">Sélectionnez un praticien</option>
                  {context.doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name} – {doctor.specialization || 'Médecin généraliste'}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-1 block">Date souhaitée</label>
                  <Input type="date" value={selectedDate} onChange={handleDateChange} />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-1 block">Type de consultation</label>
                  <Select
                    value={appointmentType}
                    onChange={(event) => setAppointmentType(event.target.value as AppointmentType)}
                  >
                    <option value={AppointmentType.IN_PERSON}>Au cabinet</option>
                    <option value={AppointmentType.VIDEO}>Téléconsultation</option>
                    <option value={AppointmentType.HOME_VISIT}>Visite à domicile</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-600 mb-2 block">Créneau disponible</label>
                {availableSlots.length === 0 ? (
                  <p className="text-sm text-neutral-500">Aucun créneau disponible pour cette date.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`px-3 py-2 rounded-lg border text-sm flex flex-col items-center gap-1 transition ${
                          selectedSlot === slot.time
                            ? 'border-primary bg-primary-50 text-primary-700'
                            : 'border-neutral-200 hover:border-primary hover:bg-primary-50/40'
                        }`}
                      >
                        <span className="font-semibold">{slot.time}</span>
                        <span className="text-xs text-neutral-500">{slot.duration} min</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-600 mb-1 block">Motif principal *</label>
                <textarea
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                  rows={3}
                  placeholder="Décrivez brièvement votre motif de consultation"
                  value={chiefComplaint}
                  onChange={(event) => setChiefComplaint(event.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-600 mb-1 block">Informations complémentaires</label>
                <textarea
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                  rows={3}
                  placeholder="Indiquez des informations utiles pour le médecin"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleBookAppointment} loading={booking} disabled={booking || !selectedDoctorId}>
                  Confirmer le rendez-vous
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200">
            <CardHeader>
              <CardTitle className="text-lg text-neutral-800 flex items-center gap-2">
                <User className="h-5 w-5 text-secondary-600" />
                Détails du praticien
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedDoctor ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-secondary-100">
                      <Stethoscope className="h-6 w-6 text-secondary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">
                        Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {selectedDoctor.specialization || 'Médecin généraliste'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-neutral-600">
                    <div>
                      <span className="block text-neutral-500 text-xs">Ville</span>
                      <span className="font-medium text-neutral-800">
                        {selectedDoctor.city || 'Non renseigné'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-neutral-500 text-xs">Honoraires indicatifs</span>
                      <span className="font-medium text-neutral-800">
                        {selectedDoctor.consultation_fee ? `${selectedDoctor.consultation_fee} €` : 'Selon acte'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-neutral-500 text-xs">Évaluation moyenne</span>
                      <span className="font-medium text-neutral-800">
                        {selectedDoctor.rating_average
                          ? `${selectedDoctor.rating_average.toFixed(1)} / 5 (${selectedDoctor.rating_count || 0})`
                          : 'Pas encore noté'}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-neutral-100 border border-neutral-200 px-3 py-3 text-xs text-neutral-600 flex items-start gap-2">
                    <Video className="h-4 w-4 mt-0.5 text-neutral-400" />
                    <p>
                      Certaines consultations peuvent être réalisées en visio. Si le créneau sélectionné propose la
                      téléconsultation, vous recevrez un lien sécurisé après confirmation.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-neutral-500">
                  Sélectionnez un médecin pour voir ses informations détaillées.
                </p>
              )}

              <div className="border-t border-neutral-200 pt-4 space-y-2 text-xs text-neutral-500">
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 mt-0.5" />
                  <p>
                    En cas d'empêchement, pensez à annuler ou déplacer votre rendez-vous au moins 24h à l'avance pour
                    libérer le créneau.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5" />
                  <p>
                    Un email de confirmation ainsi que les instructions de préparation vous seront envoyés après la
                    validation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
