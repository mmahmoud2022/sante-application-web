'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CalendarCheck2,
  CalendarX,
  CheckCircle,
  Clock,
  MapPin,
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Video,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import api from '@/lib/api';
import logger from '@/lib/logger';
import { DayOfWeek, DoctorSchedule, ScheduleType } from '@/types';

type ScheduleFormState = {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  buffer_time_minutes: number;
  max_patients_per_slot: number;
  location: string;
  location_address: string;
  is_video_consultation: boolean;
  notes: string;
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Lundi',
  [DayOfWeek.TUESDAY]: 'Mardi',
  [DayOfWeek.WEDNESDAY]: 'Mercredi',
  [DayOfWeek.THURSDAY]: 'Jeudi',
  [DayOfWeek.FRIDAY]: 'Vendredi',
  [DayOfWeek.SATURDAY]: 'Samedi',
  [DayOfWeek.SUNDAY]: 'Dimanche',
};

const TYPE_LABELS: Record<ScheduleType, string> = {
  [ScheduleType.REGULAR]: 'Récurrent',
  [ScheduleType.EXCEPTION]: 'Exception',
  [ScheduleType.HOLIDAY]: 'Absence',
  [ScheduleType.BLOCKED]: 'Bloqué',
};

const DAY_ORDER: Record<DayOfWeek, number> = {
  [DayOfWeek.MONDAY]: 0,
  [DayOfWeek.TUESDAY]: 1,
  [DayOfWeek.WEDNESDAY]: 2,
  [DayOfWeek.THURSDAY]: 3,
  [DayOfWeek.FRIDAY]: 4,
  [DayOfWeek.SATURDAY]: 5,
  [DayOfWeek.SUNDAY]: 6,
};

const DAY_FILTER_OPTIONS = [
  { value: 'all', label: 'Tous les jours' },
  { value: DayOfWeek.MONDAY, label: DAY_LABELS[DayOfWeek.MONDAY] },
  { value: DayOfWeek.TUESDAY, label: DAY_LABELS[DayOfWeek.TUESDAY] },
  { value: DayOfWeek.WEDNESDAY, label: DAY_LABELS[DayOfWeek.WEDNESDAY] },
  { value: DayOfWeek.THURSDAY, label: DAY_LABELS[DayOfWeek.THURSDAY] },
  { value: DayOfWeek.FRIDAY, label: DAY_LABELS[DayOfWeek.FRIDAY] },
  { value: DayOfWeek.SATURDAY, label: DAY_LABELS[DayOfWeek.SATURDAY] },
  { value: DayOfWeek.SUNDAY, label: DAY_LABELS[DayOfWeek.SUNDAY] },
];

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'Tous les types' },
  { value: ScheduleType.REGULAR, label: TYPE_LABELS[ScheduleType.REGULAR] },
  { value: ScheduleType.EXCEPTION, label: TYPE_LABELS[ScheduleType.EXCEPTION] },
  { value: ScheduleType.HOLIDAY, label: TYPE_LABELS[ScheduleType.HOLIDAY] },
  { value: ScheduleType.BLOCKED, label: TYPE_LABELS[ScheduleType.BLOCKED] },
];

const INITIAL_FORM: ScheduleFormState = {
  day_of_week: DayOfWeek.MONDAY,
  start_time: '09:00',
  end_time: '17:00',
  slot_duration_minutes: 30,
  buffer_time_minutes: 0,
  max_patients_per_slot: 1,
  location: '',
  location_address: '',
  is_video_consultation: false,
  notes: '',
};

const formatTime = (value: string | null | undefined): string => {
  if (!value) {
    return '—';
  }
  const [hours = '00', minutes = '00'] = value.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

const timeToMinutes = (value: string | null | undefined): number => {
  if (!value) {
    return 0;
  }
  const [hours = '0', minutes = '0'] = value.split(':');
  const parsedHours = Number.parseInt(hours, 10);
  const parsedMinutes = Number.parseInt(minutes, 10);
  return (Number.isNaN(parsedHours) ? 0 : parsedHours) * 60 + (Number.isNaN(parsedMinutes) ? 0 : parsedMinutes);
};

const formatScheduleDay = (schedule: DoctorSchedule): string => {
  if (schedule.day_of_week && DAY_LABELS[schedule.day_of_week]) {
    return DAY_LABELS[schedule.day_of_week];
  }

  if (schedule.specific_date) {
    const parsedDate = new Date(schedule.specific_date);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
  }

  return '—';
};

const formatScheduleRange = (schedule: DoctorSchedule): string => {
  return `${formatTime(schedule.start_time)} · ${formatTime(schedule.end_time)}`;
};

export default function DoctorSchedulePage(): JSX.Element {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedDay, setSelectedDay] = useState<'all' | DayOfWeek>('all');
  const [selectedType, setSelectedType] = useState<'all' | ScheduleType>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ScheduleFormState>(INITIAL_FORM);

  const loadSchedules = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await api.doctor.schedules();
      const data = Array.isArray(response.data)
        ? response.data
        : ((response.data as any)?.schedules as DoctorSchedule[]) || [];
      setSchedules(data);
    } catch (err: any) {
      logger.error('Failed to load doctor schedules', { userId: user?.id, error: err?.message }, err);
      setFeedback({ type: 'error', text: 'Impossible de charger vos disponibilités.' });
    } finally {
      setLoadingData(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || user.role !== 'doctor') {
      router.push('/login');
      return;
    }

    loadSchedules();
  }, [authLoading, user, router, loadSchedules]);

  const stats = useMemo(() => {
    const active = schedules.filter((schedule) => schedule.is_active).length;
    const available = schedules.filter((schedule) => schedule.is_active && schedule.is_available).length;
    const video = schedules.filter((schedule) => schedule.is_active && schedule.is_video_consultation).length;
    const blocked = schedules.filter((schedule) =>
      schedule.schedule_type === ScheduleType.HOLIDAY || schedule.schedule_type === ScheduleType.BLOCKED
    ).length;

    return {
      active,
      available,
      video,
      blocked,
    };
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    const list = schedules.filter((schedule) => {
      const dayMatches = selectedDay === 'all' || schedule.day_of_week === selectedDay;
      const typeMatches = selectedType === 'all' || schedule.schedule_type === selectedType;
      return dayMatches && typeMatches;
    });

    return list
      .slice()
      .sort((a, b) => {
        const aOrder = a.day_of_week ? DAY_ORDER[a.day_of_week] ?? 10 : 10;
        const bOrder = b.day_of_week ? DAY_ORDER[b.day_of_week] ?? 10 : 10;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        if (a.specific_date || b.specific_date) {
          const aDate = a.specific_date ? new Date(a.specific_date).getTime() : Number.POSITIVE_INFINITY;
          const bDate = b.specific_date ? new Date(b.specific_date).getTime() : Number.POSITIVE_INFINITY;
          if (aDate !== bDate) {
            return aDate - bDate;
          }
        }

        const aTime = timeToMinutes(a.start_time);
        const bTime = timeToMinutes(b.start_time);
        if (aTime !== bTime) {
          return aTime - bTime;
        }

        return a.id - b.id;
      });
  }, [schedules, selectedDay, selectedType]);

  const initialLoading = authLoading || (loadingData && schedules.length === 0);

  const handleRefresh = useCallback(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleToggleAvailability = useCallback(async (schedule: DoctorSchedule) => {
    setUpdatingId(schedule.id);
    try {
      const response = await api.schedules.update(schedule.id, {
        is_available: !schedule.is_available,
      });
      const updatedSchedule: DoctorSchedule = response.data;
      setSchedules((previous) => previous.map((item) => (item.id === schedule.id ? updatedSchedule : item)));
      setFeedback({
        type: 'success',
        text: !schedule.is_available ? 'Le créneau est désormais disponible.' : 'Le créneau a été mis en pause.',
      });
    } catch (err: any) {
      logger.error('Failed to toggle schedule availability', { scheduleId: schedule.id, error: err?.message }, err);
      setFeedback({ type: 'error', text: 'Impossible de mettre à jour ce créneau.' });
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const handleDelete = useCallback(async (schedule: DoctorSchedule) => {
    const confirmed = window.confirm('Confirmez-vous la suppression de ce créneau ?');
    if (!confirmed) {
      return;
    }

    setDeletingId(schedule.id);
    try {
      await api.schedules.delete(schedule.id);
      setSchedules((previous) => previous.filter((item) => item.id !== schedule.id));
      setFeedback({ type: 'success', text: 'Créneau supprimé.' });
    } catch (err: any) {
      logger.error('Failed to delete schedule', { scheduleId: schedule.id, error: err?.message }, err);
      setFeedback({ type: 'error', text: 'Impossible de supprimer ce créneau.' });
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleFormChange = useCallback(<K extends keyof ScheduleFormState>(field: K, value: ScheduleFormState[K]) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  }, []);

  const handleResetForm = useCallback(() => {
    setFormData(INITIAL_FORM);
    setFormError(null);
  }, []);

  const handleCreateSchedule = useCallback(async () => {
    setFormError(null);

    if (!formData.start_time || !formData.end_time) {
      setFormError('Veuillez renseigner les heures de début et de fin.');
      return;
    }

    if (timeToMinutes(formData.start_time) >= timeToMinutes(formData.end_time)) {
      setFormError("L'heure de fin doit être postérieure à l'heure de début.");
      return;
    }

    setCreating(true);
    try {
      await api.schedules.create({
        schedule_type: ScheduleType.REGULAR,
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        end_time: formData.end_time,
        slot_duration_minutes: formData.slot_duration_minutes,
        buffer_time_minutes: formData.buffer_time_minutes,
        max_patients_per_slot: formData.max_patients_per_slot,
        location: formData.location || undefined,
        location_address: formData.location_address || undefined,
        is_available: true,
        is_video_consultation: formData.is_video_consultation,
        is_active: true,
        notes: formData.notes || undefined,
      });

      await loadSchedules();
      setFeedback({ type: 'success', text: 'Disponibilité ajoutée.' });
      setShowCreateForm(false);
      setFormData(INITIAL_FORM);
    } catch (err: any) {
      logger.error('Failed to create schedule', { error: err?.message }, err);
      const detail = err?.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : "Impossible d'ajouter cette disponibilité.";
      setFormError(message);
      setFeedback({ type: 'error', text: message });
    } finally {
      setCreating(false);
    }
  }, [formData, loadSchedules]);

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="rounded-2xl p-8 bg-white/80 backdrop-blur shadow-xl border border-primary-100">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full p-3 bg-gradient-to-br from-primary-500 to-secondary-500">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <p className="text-neutral-600">Chargement de vos disponibilités...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl p-3 bg-gradient-to-br from-primary-500 to-secondary-500 shadow-medical">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Mes disponibilités</h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Gérez vos créneaux de consultation et gardez votre agenda à jour.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/doctor/dashboard')}>
              Retour au tableau de bord
            </Button>
            <Button variant="secondary" size="sm" onClick={handleRefresh} loading={loadingData}>
              <RefreshCw className="h-4 w-4" /> Rafraîchir
            </Button>
          </div>
        </header>

        {feedback && (
          <div
            className={`rounded-2xl border px-4 py-3 flex items-center gap-3 ${
              feedback.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300'
            }`}
            role="alert"
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{feedback.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 border-2 border-primary-200 dark:border-primary-700 shadow-medium">
            <CardContent className="py-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-primary-600 dark:text-primary-300">Créneaux actifs</p>
                <p className="text-3xl font-bold text-primary-900 dark:text-primary-100">{stats.active}</p>
                <p className="text-xs text-primary-700 dark:text-primary-400">Disponibilités publiées</p>
              </div>
              <CalendarCheck2 className="h-9 w-9 text-primary-500" />
            </CardContent>
          </Card>

          <Card className="glass-card bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 border-2 border-emerald-200 dark:border-emerald-700 shadow-medium">
            <CardContent className="py-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-300">Ouverts à la réservation</p>
                <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{stats.available}</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">Créneaux acceptant des patients</p>
              </div>
              <ToggleRight className="h-9 w-9 text-emerald-500" />
            </CardContent>
          </Card>

          <Card className="glass-card bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 border-2 border-indigo-200 dark:border-indigo-700 shadow-medium">
            <CardContent className="py-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Téléconsultations</p>
                <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{stats.video}</p>
                <p className="text-xs text-indigo-700 dark:text-indigo-400">Créneaux vidéo actifs</p>
              </div>
              <Video className="h-9 w-9 text-indigo-500" />
            </CardContent>
          </Card>

          <Card className="glass-card bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 border-2 border-amber-200 dark:border-amber-700 shadow-medium">
            <CardContent className="py-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-amber-600 dark:text-amber-300">Absences & blocages</p>
                <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{stats.blocked}</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">Jours indisponibles</p>
              </div>
              <CalendarX className="h-9 w-9 text-amber-500" />
            </CardContent>
          </Card>
        </div>

        <Card className="border border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle>Filtrer les créneaux</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full lg:w-auto">
              <Select
                label="Jour"
                value={selectedDay}
                onChange={(event) => setSelectedDay(event.target.value as 'all' | DayOfWeek)}
                options={DAY_FILTER_OPTIONS}
              />
              <Select
                label="Type"
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value as 'all' | ScheduleType)}
                options={TYPE_FILTER_OPTIONS}
              />
              <div className="flex items-end">
                <Button variant="outline" fullWidth onClick={() => {
                  setSelectedDay('all');
                  setSelectedType('all');
                }}>
                  Réinitialiser
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="border border-neutral-200 dark:border-neutral-700">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Ajouter une disponibilité</CardTitle>
            <Button variant={showCreateForm ? 'outline' : 'primary'} size="sm" onClick={() => setShowCreateForm((prev) => !prev)}>
              <Plus className="h-4 w-4" /> {showCreateForm ? 'Fermer le formulaire' : 'Nouveau créneau'}
            </Button>
          </CardHeader>
          {showCreateForm && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Jour de la semaine"
                  value={formData.day_of_week}
                  onChange={(event) => handleFormChange('day_of_week', event.target.value as DayOfWeek)}
                  options={DAY_FILTER_OPTIONS.filter((option) => option.value !== 'all')}
                  required
                />
                <Input
                  label="Heure de début"
                  type="time"
                  value={formData.start_time}
                  onChange={(event) => handleFormChange('start_time', event.target.value)}
                  required
                />
                <Input
                  label="Heure de fin"
                  type="time"
                  value={formData.end_time}
                  onChange={(event) => handleFormChange('end_time', event.target.value)}
                  required
                />
                <Input
                  label="Durée des rendez-vous (minutes)"
                  type="number"
                  min={15}
                  max={240}
                  value={formData.slot_duration_minutes}
                  onChange={(event) =>
                    handleFormChange('slot_duration_minutes', Number(event.target.value) || 30)
                  }
                  required
                />
                <Input
                  label="Temps de pause (minutes)"
                  type="number"
                  min={0}
                  max={60}
                  value={formData.buffer_time_minutes}
                  onChange={(event) => handleFormChange('buffer_time_minutes', Number(event.target.value) || 0)}
                />
                <Input
                  label="Patients par créneau"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.max_patients_per_slot}
                  onChange={(event) => handleFormChange('max_patients_per_slot', Number(event.target.value) || 1)}
                  required
                />
                <Input
                  label="Lieu (facultatif)"
                  value={formData.location}
                  onChange={(event) => handleFormChange('location', event.target.value)}
                />
                <Input
                  label="Adresse (facultatif)"
                  value={formData.location_address}
                  onChange={(event) => handleFormChange('location_address', event.target.value)}
                />
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                <input
                  id="video-consultation"
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  checked={formData.is_video_consultation}
                  onChange={(event) => handleFormChange('is_video_consultation', event.target.checked)}
                />
                <label htmlFor="video-consultation">Autoriser la téléconsultation pour ces créneaux</label>
              </div>

              <TextArea
                label="Notes internes (facultatif)"
                rows={3}
                value={formData.notes}
                onChange={(event) => handleFormChange('notes', event.target.value)}
                helperText="Ces notes ne sont pas visibles par les patients."
              />

              {formError && (
                <p className="text-sm text-red-600 dark:text-red-400 mb-3" role="alert">
                  {formError}
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleResetForm}>
                  Réinitialiser
                </Button>
                <Button variant="primary" size="sm" onClick={handleCreateSchedule} loading={creating}>
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="border border-neutral-200 dark:border-neutral-700 shadow-lg">
          <CardHeader>
            <CardTitle>Vos créneaux</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-10 text-neutral-500 dark:text-neutral-400">
                <CalendarIcon className="h-10 w-10 mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
                <p>Aucun créneau ne correspond aux filtres sélectionnés.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSchedules.map((schedule) => {
                  const maxPatients = schedule.max_patients_per_slot ?? 1;
                  const slotDuration = schedule.slot_duration_minutes ?? 30;

                  return (
                    <div
                      key={schedule.id}
                      className="border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 bg-white/70 dark:bg-neutral-900/40 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                    >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          schedule.schedule_type === ScheduleType.REGULAR
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                            : schedule.schedule_type === ScheduleType.EXCEPTION
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}
                        >
                          {TYPE_LABELS[schedule.schedule_type] ?? schedule.schedule_type}
                        </span>
                        {schedule.is_video_consultation && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                            <Video className="h-4 w-4" /> Téléconsultation
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatScheduleDay(schedule)}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" /> {formatScheduleRange(schedule)}
                        </span>
                        <span>
                          {slotDuration} min · {maxPatients}{' '}
                          {maxPatients > 1 ? 'patients' : 'patient'}
                        </span>
                        {schedule.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> {schedule.location}
                          </span>
                        )}
                        {!schedule.is_available && (
                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-300">En pause</span>
                        )}
                      </div>
                      {schedule.notes && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{schedule.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAvailability(schedule)}
                        loading={updatingId === schedule.id}
                      >
                        {schedule.is_available ? (
                          <>
                            <ToggleLeft className="h-4 w-4" /> Mettre en pause
                          </>
                        ) : (
                          <>
                            <ToggleRight className="h-4 w-4" /> Réactiver
                          </>
                        )}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(schedule)}
                        loading={deletingId === schedule.id}
                      >
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
