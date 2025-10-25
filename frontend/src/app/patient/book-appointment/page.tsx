'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
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
  ArrowLeft,
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

function PatientBookAppointmentContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- State ---
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

  // --- Utils ---
  const queryDoctor = useMemo(() => {
    const value = searchParams.get('doctor');
    if (!value) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }, [searchParams]);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    if (type === 'success') {
      setTimeout(() => setMessage(null), 2500);
    }
  }, []);

  const resetBookingForm = useCallback(() => {
    setChiefComplaint('');
    setNotes('');
    setSelectedSlot('');
  }, []);

  // --- Load context ---
  const loadContext = useCallback(
    async (doctorId?: number | null, date?: string | null) => {
      try {
        setLoading(true);
        const response = await api.patient.bookAppointmentContext({
          doctor: doctorId ?? undefined,
          date: date ?? undefined,
        });

        const data: AppointmentBookingContext = response.data;

        // ✅ Déduplication des créneaux
        const uniqueSlots =
          data.available_slots?.filter(
            (slot, index, self) => index === self.findIndex((s) => s.time === slot.time)
          ) ?? [];

        setContext({
          ...data,
          available_slots: uniqueSlots,
        });

        setSelectedDoctorId(data.selected_doctor?.id ?? doctorId ?? null);
        if (date) setSelectedDate(date);
        setSelectedSlot(uniqueSlots[0]?.time ?? '');
      } catch (error: any) {
        logger.error('Failed to load appointment booking context', { doctorId, date, error });
        showMessage('error', 'Impossible de charger les créneaux disponibles. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    },
    [showMessage]
  );

  // --- Auth check + initial load ---
  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'patient') {
      router.push('/login');
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];
    setSelectedDate(defaultDate);

    loadContext(queryDoctor, defaultDate);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]); // ✅ pas de router/queryDoctor pour éviter rechargement multiple

  // --- Handlers ---
  const handleDoctorChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value ? Number(e.target.value) : null;
      setSelectedDoctorId(id);
      setSelectedSlot('');
      if (id) loadContext(id, selectedDate);
    },
    [loadContext, selectedDate]
  );

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const date = e.target.value;
      setSelectedDate(date);
      if (selectedDoctorId) loadContext(selectedDoctorId, date);
    },
    [selectedDoctorId, loadContext]
  );

  const handleBookAppointment = useCallback(async () => {
    if (!selectedDoctorId || !selectedDate || !selectedSlot || !chiefComplaint.trim()) {
      showMessage('error', 'Veuillez remplir tous les champs obligatoires avant de confirmer.');
      return;
    }

    setBooking(true);
    setMessage(null);

    try {
      const appointmentDateTime = `${selectedDate}T${selectedSlot}:00`;

      await api.appointments.create({
        doctor_id: selectedDoctorId,
        appointment_date: appointmentDateTime,
        appointment_time: selectedSlot,
        appointment_type: appointmentType,
        chief_complaint: chiefComplaint,
        reason: chiefComplaint,
        notes: notes || undefined,
      });

      showMessage('success', 'Votre rendez-vous a été réservé avec succès !');
      resetBookingForm();

      setTimeout(() => router.push('/patient/appointments'), 1200);
    } catch (error: any) {
      logger.error('Booking failed', { selectedDoctorId, selectedDate, selectedSlot, error });

      const detail = error?.response?.data?.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
          ? detail.map((d: any) => d.msg || d.message).join(', ')
          : 'La réservation a échoué. Veuillez réessayer.';

      showMessage('error', msg);
    } finally {
      setBooking(false);
    }
  }, [
    selectedDoctorId,
    selectedDate,
    selectedSlot,
    chiefComplaint,
    notes,
    appointmentType,
    resetBookingForm,
    showMessage,
    router,
  ]);

  // --- Derived values ---
  const selectedDoctor: AppointmentBookingDoctorSummary | undefined = useMemo(() => {
    if (!selectedDoctorId) return undefined;
    return (
      context.selected_doctor?.id === selectedDoctorId
        ? context.selected_doctor
        : context.doctors.find((d) => d.id === selectedDoctorId)
    );
  }, [context, selectedDoctorId]);

  const availableSlots = context.available_slots ?? [];

  // --- UI ---
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-neutral-600">Chargement de l’assistant de réservation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* --- Header --- */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-100">
              <CalendarIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Réserver un rendez-vous</h1>
              <p className="text-sm text-neutral-500">
                Choisissez un médecin, une date et un créneau pour confirmer votre consultation.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Button variant="outline" onClick={() => router.push('/patient/dashboard')}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Tableau de bord
            </Button>
            <Button variant="outline" onClick={() => router.push('/patient/appointments')}>
              Mes rendez-vous
            </Button>
          </div>
        </header>

        {/* --- Message --- */}
        {message && (
          <div
            className={`rounded-lg px-4 py-3 flex items-center gap-2 shadow-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* --- Main Content --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* --- Booking Form --- */}
          <Card className="lg:col-span-2 border border-neutral-200">
            <CardHeader>
              <CardTitle className="text-lg text-neutral-800 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary-600" />
                Sélection du rendez-vous
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Médecin */}
              <div>
                <label className="text-sm font-medium text-neutral-600 mb-1 block">Choisir un médecin</label>
                <Select value={selectedDoctorId ?? ''} onChange={handleDoctorChange}>
                  <option value="">Sélectionnez un praticien</option>
                  {context.doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr {doctor.first_name} {doctor.last_name} – {doctor.specialization || 'Médecin généraliste'}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Date & Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-1 block">Date souhaitée</label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-1 block">Type de consultation</label>
                  <Select
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                  >
                    <option value={AppointmentType.IN_PERSON}>Au cabinet</option>
                    <option value={AppointmentType.VIDEO_CALL}>Téléconsultation</option>
                    <option value={AppointmentType.PHONE_CALL}>Consultation téléphonique</option>
                  </Select>
                </div>
              </div>

              {/* Créneaux */}
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
                        className={`px-3 py-2 rounded-lg border text-sm transition ${
                          selectedSlot === slot.time
                            ? 'border-primary bg-primary-50 text-primary-700 font-medium'
                            : 'border-neutral-200 hover:border-primary hover:bg-primary-50/40'
                        }`}
                      >
                        <span>{slot.time}</span>
                        <span className="block text-xs text-neutral-500">{slot.duration} min</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Motif principal */}
              <div>
                <label className="text-sm font-medium text-neutral-600 mb-1 block">Motif principal *</label>
                <textarea
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                  rows={3}
                  placeholder="Décrivez brièvement votre motif de consultation"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-neutral-600 mb-1 block">Informations complémentaires</label>
                <textarea
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                  rows={3}
                  placeholder="Indiquez des informations utiles pour le médecin"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleBookAppointment}
                  loading={booking}
                  disabled={booking || !selectedDoctorId || !chiefComplaint.trim()}
                >
                  Confirmer le rendez-vous
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* --- Doctor Info --- */}
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
                  <DoctorInfo doctor={selectedDoctor} />
                </>
              ) : (
                <p className="text-sm text-neutral-500">Sélectionnez un médecin pour voir ses informations.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PatientBookAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }
    >
      <PatientBookAppointmentContent />
    </Suspense>
  );
}

// --- Components ---
function DoctorInfo({ doctor }: { doctor: AppointmentBookingDoctorSummary }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-secondary-100">
          <Stethoscope className="h-6 w-6 text-secondary-600" />
        </div>
        <div>
          <p className="font-semibold text-neutral-900">
            Dr {doctor.first_name} {doctor.last_name}
          </p>
          <p className="text-sm text-neutral-500">{doctor.specialization || 'Médecin généraliste'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-neutral-600">
        <Info label="Ville" value={doctor.city || 'Non renseigné'} />
        <Info
          label="Honoraires indicatifs"
          value={doctor.consultation_fee ? `${doctor.consultation_fee} €` : 'Selon acte'}
        />
        <Info
          label="Évaluation moyenne"
          value={
            doctor.rating_average
              ? `${doctor.rating_average.toFixed(1)} / 5 (${doctor.rating_count || 0})`
              : 'Pas encore noté'
          }
        />
      </div>

      <InfoBox
        icon={<Video className="h-4 w-4 mt-0.5 text-neutral-400" />}
        text="Certaines consultations peuvent être réalisées en visio. Si le créneau sélectionné propose la téléconsultation, vous recevrez un lien sécurisé après confirmation."
      />

      <div className="border-t border-neutral-200 pt-4 space-y-2 text-xs text-neutral-500">
        <InfoBox
          icon={<Building2 className="h-4 w-4 mt-0.5" />}
          text="En cas d'empêchement, merci d’annuler votre rendez-vous au moins 24h à l’avance."
        />
        <InfoBox
          icon={<Clock className="h-4 w-4 mt-0.5" />}
          text="Un email de confirmation et les instructions vous seront envoyés après validation."
        />
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-neutral-500 text-xs">{label}</span>
      <span className="font-medium text-neutral-800">{value}</span>
    </div>
  );
}

function InfoBox({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="rounded-lg bg-neutral-100 border border-neutral-200 px-3 py-3 text-xs text-neutral-600 flex items-start gap-2">
      {icon}
      <p>{text}</p>
    </div>
  );
}
