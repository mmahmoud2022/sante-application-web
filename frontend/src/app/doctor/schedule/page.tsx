/**
 * Doctor Schedule Management Page
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Layers,
  PlusCircle,
  ChevronLeft,
  ListChecks,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import api from '@/lib/api';
import logger from '@/lib/logger';
import { AppointmentSlot } from '@/types';

interface ScheduleEntry {
  id: number;
  schedule_type: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  buffer_time_minutes: number;
  max_patients_per_slot: number;
  day_of_week?: string | null;
  specific_date?: string | null;
  location?: string | null;
  is_available: boolean;
  is_video_consultation: boolean;
  notes?: string | null;
}

interface ScheduleFormState {
  schedule_type: 'regular' | 'exception';
  day_of_week: string;
  specific_date: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: string;
  buffer_time_minutes: string;
  max_patients_per_slot: string;
  location: string;
  notes: string;
  is_video_consultation: boolean;
  is_available: boolean;
}

const DEFAULT_FORM: ScheduleFormState = {
  schedule_type: 'regular',
  day_of_week: 'monday',
  specific_date: '',
  start_time: '09:00',
  end_time: '17:00',
  slot_duration_minutes: '30',
  buffer_time_minutes: '0',
  max_patients_per_slot: '1',
  location: '',
  notes: '',
  is_video_consultation: false,
  is_available: true,
};

const DAY_OPTIONS = [
  { value: 'monday', label: 'Lundi' },
  { value: 'tuesday', label: 'Mardi' },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday', label: 'Jeudi' },
  { value: 'friday', label: 'Vendredi' },
  { value: 'saturday', label: 'Samedi' },
  { value: 'sunday', label: 'Dimanche' },
];

export default function DoctorSchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ScheduleFormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

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
      loadSchedule();
    }
  }, [user, authLoading, router]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const response = await api.doctor.schedule();
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.items || [];
      setSchedule(data);
    } catch (error: any) {
      logger.error('Failed to load doctor schedule', {
        userId: user?.id,
        errorMessage: error?.message,
      }, error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = event.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateSchedule = async () => {
    if (formData.schedule_type === 'regular' && !formData.day_of_week) {
      alert('Veuillez sélectionner un jour de la semaine.');
      return;
    }

    if (formData.schedule_type === 'exception' && !formData.specific_date) {
      alert('Veuillez sélectionner une date spécifique.');
      return;
    }

    const payload: Record<string, any> = {
      schedule_type: formData.schedule_type,
      start_time: formData.start_time,
      end_time: formData.end_time,
      slot_duration_minutes: Number(formData.slot_duration_minutes) || 30,
      buffer_time_minutes: Number(formData.buffer_time_minutes) || 0,
      max_patients_per_slot: Number(formData.max_patients_per_slot) || 1,
      location: formData.location || null,
      notes: formData.notes || null,
      is_video_consultation: formData.is_video_consultation,
      is_available: formData.is_available,
    };

    if (formData.schedule_type === 'regular') {
      payload.day_of_week = formData.day_of_week;
      payload.specific_date = null;
    } else {
      payload.specific_date = new Date(formData.specific_date).toISOString();
      payload.day_of_week = null;
    }

    setSubmitting(true);
    try {
      await api.schedules.create(payload);
      setFormData(DEFAULT_FORM);
      await loadSchedule();
      alert('Créneau ajouté avec succès.');
    } catch (error: any) {
      logger.error('Failed to create schedule', {
        userId: user?.id,
        errorMessage: error?.message,
      }, error);
      alert(error?.response?.data?.detail || 'Impossible de créer ce créneau.');
    } finally {
      setSubmitting(false);
    }
  };

  const loadAvailabilityForDate = async () => {
    if (!selectedDate) {
      alert('Veuillez choisir une date.');
      return;
    }

    setSlotsLoading(true);
    try {
      const response = await api.doctor.availableSlots(selectedDate);
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.available_slots || response.data;
      setAvailableSlots(data || []);
    } catch (error: any) {
      logger.error('Failed to load availability', {
        userId: user?.id,
        date: selectedDate,
        errorMessage: error?.message,
      }, error);
      alert('Impossible de récupérer les disponibilités.');
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const regularSchedules = useMemo(
    () => schedule.filter((entry) => entry.schedule_type === 'regular'),
    [schedule]
  );

  const exceptionSchedules = useMemo(
    () => schedule.filter((entry) => entry.schedule_type !== 'regular'),
    [schedule]
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-neutral-600">Chargement de votre agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-xl">
              <CalendarIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Mon agenda</h1>
              <p className="text-sm text-neutral-500">Configurez vos disponibilités pour vos patients</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push('/doctor/dashboard')}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Tableau de bord
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border border-neutral-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary-600" />
                Ajouter un créneau de disponibilité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-1 block">Type de disponibilité</label>
                  <Select
                    name="schedule_type"
                    value={formData.schedule_type}
                    onChange={handleFormChange}
                  >
                    <option value="regular">Récurrente</option>
                    <option value="exception">Exceptionnelle / ponctuelle</option>
                  </Select>
                </div>
                {formData.schedule_type === 'regular' ? (
                  <div>
                    <label className="text-sm font-medium text-neutral-600 mb-1 block">Jour de la semaine</label>
                    <Select name="day_of_week" value={formData.day_of_week} onChange={handleFormChange}>
                      {DAY_OPTIONS.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium text-neutral-600 mb-1 block">Date spécifique</label>
                    <Input
                      type="date"
                      name="specific_date"
                      value={formData.specific_date}
                      onChange={handleFormChange}
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-1 block">Heure de début</label>
                  <Input type="time" name="start_time" value={formData.start_time} onChange={handleFormChange} />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-1 block">Heure de fin</label>
                  <Input type="time" name="end_time" value={formData.end_time} onChange={handleFormChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-1 block">Durée du créneau (min)</label>
                  <Input
                    type="number"
                    min={10}
                    max={180}
                    name="slot_duration_minutes"
                    value={formData.slot_duration_minutes}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-1 block">Temps de pause (min)</label>
                  <Input
                    type="number"
                    min={0}
                    max={60}
                    name="buffer_time_minutes"
                    value={formData.buffer_time_minutes}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-1 block">Patients par créneau</label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    name="max_patients_per_slot"
                    value={formData.max_patients_per_slot}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-1 block">Lieu / Cabinet</label>
                  <Input
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    placeholder="Cabinet principal"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-1 block">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Informations complémentaires pour ce créneau"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2 text-sm text-neutral-600">
                  <input
                    type="checkbox"
                    name="is_video_consultation"
                    checked={formData.is_video_consultation}
                    onChange={handleFormChange}
                  />
                  Téléconsultation disponible
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-neutral-600">
                  <input
                    type="checkbox"
                    name="is_available"
                    checked={formData.is_available}
                    onChange={handleFormChange}
                  />
                  Activer ce créneau
                </label>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleCreateSchedule} loading={submitting} disabled={submitting}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Ajouter le créneau
                </Button>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <p>
                  Les patients verront automatiquement vos disponibilités mises à jour. Pensez à ajouter vos périodes de
                  congés en tant que créneaux d'exception pour bloquer la prise de rendez-vous.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-neutral-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary-600" /> Disponibilités par date
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-600 mb-1 block">
                  Choisir une date pour vérifier les créneaux ouverts
                </label>
                <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
                <Button variant="outline" onClick={loadAvailabilityForDate} disabled={!selectedDate || slotsLoading}>
                  Voir les créneaux disponibles
                </Button>
              </div>
              <div className="space-y-2">
                {slotsLoading ? (
                  <div className="text-sm text-neutral-500">Calcul des disponibilités...</div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-sm text-neutral-500">
                    Aucun créneau disponible pour cette date
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {availableSlots.map((slot, index) => (
                      <li
                        key={`${slot.time}-${index}`}
                        className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2 bg-white"
                      >
                        <Clock className="h-4 w-4 text-primary-600" />
                        <span className="text-sm font-medium text-neutral-800">{slot.time}</span>
                        <span className="text-xs text-neutral-500">{slot.duration} min</span>
                        {slot.location && (
                          <span className="text-xs text-neutral-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {slot.location}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-neutral-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary-600" /> Créneaux récurrents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {regularSchedules.length === 0 ? (
                <p className="text-sm text-neutral-500">Aucun créneau récurrent défini.</p>
              ) : (
                <div className="space-y-3">
                  {regularSchedules.map((entry) => (
                    <div key={entry.id} className="border border-neutral-200 rounded-lg px-4 py-3 bg-white">
                      <div className="flex items-center justify-between text-sm text-neutral-600">
                        <span className="font-semibold text-neutral-800 uppercase">
                          {DAY_OPTIONS.find((day) => day.value === entry.day_of_week)?.label || entry.day_of_week}
                        </span>
                        <span>
                          {entry.start_time} - {entry.end_time}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                        <span>{entry.slot_duration_minutes} min</span>
                        <span>{entry.max_patients_per_slot} patient(s)</span>
                        {entry.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {entry.location}
                          </span>
                        )}
                        <span>{entry.is_available ? 'Actif' : 'Inactif'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-neutral-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-secondary-600" /> Exceptions & congés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {exceptionSchedules.length === 0 ? (
                <p className="text-sm text-neutral-500">Aucun créneau exceptionnel défini.</p>
              ) : (
                <div className="space-y-3">
                  {exceptionSchedules.map((entry) => (
                    <div key={entry.id} className="border border-neutral-200 rounded-lg px-4 py-3 bg-white">
                      <div className="flex items-center justify-between text-sm text-neutral-600">
                        <span className="font-semibold text-neutral-800">
                          {entry.specific_date
                            ? new Date(entry.specific_date).toLocaleDateString('fr-FR')
                            : 'Exception'}
                        </span>
                        <span>
                          {entry.start_time} - {entry.end_time}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                        <span>{entry.schedule_type}</span>
                        <span>{entry.slot_duration_minutes} min</span>
                        {entry.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {entry.location}
                          </span>
                        )}
                        <span>{entry.is_available ? 'Ouvert' : 'Fermé'}</span>
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-neutral-500 mt-2">{entry.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
