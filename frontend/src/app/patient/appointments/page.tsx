/**
 * Appointment Booking Calendar Page
 * Allows patients to view and book appointments with doctors
 */

'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

import {
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  Video,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  CalendarCheck,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import api from '@/lib/api';
import logger from '@/lib/logger';
import { Appointment, User as UserType, AppointmentStatus, AppointmentType } from '@/types';

export default function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<UserType[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  // Booking form state
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<AppointmentType>(AppointmentType.IN_PERSON);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [notes, setNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | AppointmentStatus>('all');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const resetBookingForm = useCallback(() => {
    setEditingAppointment(null);
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setAppointmentType(AppointmentType.IN_PERSON);
    setChiefComplaint('');
    setNotes('');
    setAvailableSlots([]);
  }, []);

  const closeBookingForm = useCallback(() => {
    setShowBookingForm(false);
    resetBookingForm();
  }, [resetBookingForm]);

  const handleStartBooking = useCallback(() => {
    resetBookingForm();
    setShowBookingForm(true);
  }, [resetBookingForm]);

  const loadData = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoadingError(null);
    setLoadingData(true);

    try {
      const results = await Promise.allSettled([
        api.appointments.list({ limit: 100 }),
        api.users.doctors({ limit: 100 }),
      ]);

      const [appointmentsRes, doctorsRes] = results;

      if (appointmentsRes.status === 'fulfilled') {
        const nextAppointments = dedupeById<Appointment>(
          extractItems<Appointment>(appointmentsRes.value.data)
        );
        setAppointments(nextAppointments);
      } else {
        setLoadingError(
          'Unable to load your appointments right now. Please try again in a few moments.'
        );
        logger.error(
          'Failed to load appointments',
          {
            userId: user.id,
            errorMessage: appointmentsRes.reason?.message,
          },
          appointmentsRes.reason
        );
      }

      if (doctorsRes.status === 'fulfilled') {
        const nextDoctors = dedupeById<UserType>(extractItems<UserType>(doctorsRes.value.data));
        setDoctors(nextDoctors);
      } else {
        logger.warn(
          'Failed to load doctor directory for patient appointments',
          {
            userId: user.id,
            errorMessage: doctorsRes.reason?.message,
          },
          doctorsRes.reason
        );
      }
    } catch (error: any) {
      setLoadingError(
        'An unexpected error occurred while loading your appointments. Please try again later.'
      );
      logger.error(
        'Unhandled error while loading patient appointments page',
        {
          userId: user?.id,
          errorMessage: error?.message,
        },
        error
      );
    } finally {
      setLoadingData(false);
    }
  }, [user]);

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
      loadData();
    }
  }, [user, authLoading, router, loadData]);

  const loadAvailableSlots = async (doctorId: number, date: Date, preserveSlot?: string | null) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await api.appointments.getAvailableSlots(doctorId, dateStr);
      const payload = response.data;
      let slotValues: unknown = payload;

      if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        slotValues = (payload as { slots?: unknown }).slots ?? [];
      }

      const normalizedSlots = (Array.isArray(slotValues) ? slotValues : [])
        .map((slot) => {
          if (typeof slot === 'string') {
            return slot;
          }
          if (slot && typeof slot === 'object') {
            const slotObj = slot as Record<string, unknown>;
            const directTime = slotObj.time;
            if (typeof directTime === 'string') {
              return directTime;
            }
            const startTime = slotObj.start_time;
            if (typeof startTime === 'string') {
              return startTime;
            }
          }
          return null;
        })
        .filter((value): value is string => Boolean(value));

      const slotsWithCurrent = preserveSlot && !normalizedSlots.includes(preserveSlot)
        ? [preserveSlot, ...normalizedSlots]
        : normalizedSlots;

      setAvailableSlots(slotsWithCurrent);
    } catch (error: any) {
      logger.error('Failed to load available slots', {
        userId: user?.id,
        doctorId,
        date: date.toISOString(),
        errorMessage: error?.message,
      }, error);
      // Generate sample slots if API fails
      const sampleSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
      ];
      const fallbackSlots = preserveSlot && !sampleSlots.includes(preserveSlot)
        ? [preserveSlot, ...sampleSlots]
        : sampleSlots;
      setAvailableSlots(fallbackSlots);
    }
  };

  const openBookingFormForEdit = (appointment: Appointment) => {
    resetBookingForm();
    setEditingAppointment(appointment);
    setShowBookingForm(true);

    const doctorId = appointment.doctor_id;
    setSelectedDoctor(doctorId);

    const appointmentDateValue = toDate(appointment.appointment_date, appointment.appointment_time);
    if (appointmentDateValue) {
      setSelectedDate(appointmentDateValue);
      loadAvailableSlots(doctorId, appointmentDateValue, appointment.appointment_time);
    }

    setSelectedSlot(appointment.appointment_time ?? null);
    setAppointmentType(appointment.appointment_type);
    setChiefComplaint(appointment.reason ?? '');
    setNotes(appointment.notes ?? '');
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (selectedDoctor) {
      loadAvailableSlots(selectedDoctor, date);
    }
  };

  const handleDoctorSelect = (doctorId: number) => {
    if (editingAppointment) {
      return;
    }
    setSelectedDoctor(doctorId);
    setSelectedSlot(null);
    if (selectedDate) {
      loadAvailableSlots(doctorId, selectedDate);
    }
  };

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const dateA = toDate(a.appointment_date, a.appointment_time);
      const dateB = toDate(b.appointment_date, b.appointment_time);
      if (!dateA || !dateB) {
        return 0;
      }
      return dateA.getTime() - dateB.getTime();
    });
  }, [appointments]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return sortedAppointments.filter((appointment) => {
      const date = toDate(appointment.appointment_date, appointment.appointment_time);
      if (!date) {
        return false;
      }
      return date >= now;
    });
  }, [sortedAppointments]);

  const summaryStats = useMemo(() => {
    const completed = appointments.filter((appointment) => appointment.status === AppointmentStatus.COMPLETED).length;
    const cancelled = appointments.filter((appointment) => appointment.status === AppointmentStatus.CANCELLED).length;
    return {
      total: appointments.length,
      upcoming: upcomingAppointments.length,
      completed,
      cancelled,
    };
  }, [appointments, upcomingAppointments.length]);

  const filteredAppointments = useMemo(() => {
    return sortedAppointments
      .filter((appointment) => filterStatus === 'all' || appointment.status === filterStatus)
      .reverse();
  }, [sortedAppointments, filterStatus]);

  const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

  const editingOriginalDate = useMemo(() => {
    if (!editingAppointment) {
      return '';
    }
    return formatLongDate(editingAppointment.appointment_date);
  }, [editingAppointment]);

  const editingOriginalTime = useMemo(() => {
    if (!editingAppointment) {
      return '';
    }
    return formatTimeValue(editingAppointment.appointment_date, editingAppointment.appointment_time);
  }, [editingAppointment]);
  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot || !chiefComplaint) {
      alert('Please fill in all required fields');
      return;
    }

    const appointmentDateTime = toDate(selectedDate, selectedSlot);
    if (!appointmentDateTime) {
      alert('The selected date or time is invalid.');
      return;
    }

    const isEditing = Boolean(editingAppointment);

    try {
      if (isEditing && editingAppointment) {
        await api.appointments.update(editingAppointment.id, {
          appointment_date: appointmentDateTime.toISOString(),
          appointment_type: appointmentType,
          reason: chiefComplaint,
          notes: notes || undefined,
        });
        alert('Appointment updated successfully!');
      } else {
        await api.appointments.create({
          doctor_id: selectedDoctor,
          appointment_date: appointmentDateTime.toISOString(),
          appointment_time: selectedSlot,
          appointment_type: appointmentType,
          chief_complaint: chiefComplaint,
          reason: chiefComplaint,
          notes: notes || undefined,
        });
        alert('Appointment booked successfully!');
      }

      closeBookingForm();
      await loadData();
    } catch (error: any) {
      const payloadContext = {
        userId: user?.id,
        appointmentId: editingAppointment?.id,
        doctorId: selectedDoctor,
        date: selectedDate?.toISOString(),
        slot: selectedSlot,
        errorMessage: error?.message,
      };

      logger.error(isEditing ? 'Failed to update appointment' : 'Failed to book appointment', payloadContext, error);

      alert(
        error?.response?.data?.detail ||
          (isEditing ? 'Failed to update appointment' : 'Failed to book appointment')
      );
    }
  };

  const canReschedule = useCallback((appointment: Appointment) => {
    if (appointment.status !== AppointmentStatus.PENDING && appointment.status !== AppointmentStatus.CONFIRMED) {
      return false;
    }

    const appointmentDate = toDate(appointment.appointment_date, appointment.appointment_time);
    if (!appointmentDate) {
      return false;
    }

    return appointmentDate >= new Date();
  }, []);

  const handleJoinVideoCall = useCallback((appointment: Appointment) => {
    if (!appointment.video_call_link) {
      alert('The video call link is not available yet. Please try again closer to the appointment time.');
      return;
    }

    try {
      window.open(appointment.video_call_link, '_blank', 'noopener');
    } catch (error: any) {
      logger.error('Failed to open video call link', {
        appointmentId: appointment.id,
        errorMessage: error?.message,
      }, error);
      alert('Unable to open the video call link. Please copy it manually from your appointment details.');
    }
  }, []);

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setCancellingId(appointmentId);
      await api.appointments.cancel(appointmentId, 'Cancelled by patient');
      alert('Appointment cancelled successfully');
      loadData();
    } catch (error: any) {
      logger.error('Failed to cancel appointment', {
        userId: user?.id,
        appointmentId,
        errorMessage: error?.message,
      }, error);
      alert('Failed to cancel appointment');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const Icon = APPOINTMENT_STATUS_ICONS[status] ?? AlertCircle;
    const label = APPOINTMENT_STATUS_LABELS[status] ?? status;
    const classes = APPOINTMENT_STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </span>
    );
  };

  const getTypeIcon = (type: AppointmentType) => {
    switch (type) {
      case AppointmentType.VIDEO_CALL:
        return <Video className="w-4 h-4" />;
      case AppointmentType.PHONE_CALL:
        return <Phone className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: AppointmentType) => APPOINTMENT_TYPE_LABELS[type] ?? 'Appointment';

  // Calendar rendering functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      const isToday = new Date().toDateString() === date.toDateString();
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
      
      days.push(
        <button
          key={day}
          onClick={() => !isPast && handleDateSelect(date)}
          disabled={isPast}
          className={`
            p-2 text-sm rounded-lg transition-colors
            ${isSelected ? 'bg-primary text-white' : ''}
            ${isToday && !isSelected ? 'bg-blue-100 text-blue-800 font-bold' : ''}
            ${!isSelected && !isToday && !isPast ? 'hover:bg-gray-100' : ''}
            ${isPast ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (authLoading || loadingData) {
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
              <h1 className="text-2xl font-bold text-gray-900">Mes Rendez-vous</h1>
              <p className="text-gray-600 mt-1">Consultez et gérez vos rendez-vous</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/patient/dashboard')}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour au tableau de bord
              </Button>
              <Button onClick={handleStartBooking}>
                <CalendarIcon className="w-5 h-5 mr-2" />
                Prendre rendez-vous
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loadingError && (
          <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">{loadingError}</p>
                <p className="text-xs text-red-600/80">Veuillez actualiser la page ou réessayer plus tard.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryStatCard
            title="Nombre total de nominations"
            subtitle="Tout le temps"
            value={summaryStats.total}
            icon={<CalendarCheck className="h-6 w-6 text-primary-600" />}
            accent="primary"
          />
          <SummaryStatCard
            title="À venir"
            subtitle="Programmé"
            value={summaryStats.upcoming}
            icon={<Clock className="h-6 w-6 text-blue-600" />}
            accent="secondary"
          />
          <SummaryStatCard
            title="Complété"
            subtitle="Terminé"
            value={summaryStats.completed}
            icon={<CheckCircle className="h-6 w-6 text-green-600" />}
            accent="success"
          />
          <SummaryStatCard
            title="Annulé"
            subtitle="Tout le temps"
            value={summaryStats.cancelled}
            icon={<XCircle className="h-6 w-6 text-red-600" />}
            accent="danger"
          />
        </div>

        {nextAppointment && (
          <Card className="border-2 border-primary-100">
            <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <CalendarCheck className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Next appointment</p>
                  <h2 className="text-xl font-bold text-gray-900">
                    {nextAppointment.doctor ? `Dr. ${nextAppointment.doctor.first_name} ${nextAppointment.doctor.last_name}` : 'Upcoming consultation'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {formatLongDate(nextAppointment.appointment_date)} · {formatTimeValue(nextAppointment.appointment_date, nextAppointment.appointment_time)}
                  </p>
                  {nextAppointment.reason && (
                    <p className="text-sm text-gray-500 mt-2">
                      Raison: {nextAppointment.reason}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-primary-100 rounded-lg">
                  {getTypeIcon(nextAppointment.appointment_type)}
                  <span className="text-sm font-medium text-gray-700">{getTypeLabel(nextAppointment.appointment_type)}</span>
                </div>
                {canReschedule(nextAppointment) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openBookingFormForEdit(nextAppointment)}
                    disabled={editingAppointment?.id === nextAppointment.id}
                  >
                    {editingAppointment?.id === nextAppointment.id ? 'Editing…' : 'Reschedule'}
                  </Button>
                )}
                {nextAppointment.status === AppointmentStatus.CONFIRMED && nextAppointment.appointment_type === AppointmentType.VIDEO_CALL && (
                  <Button
                    size="sm"
                    onClick={() => handleJoinVideoCall(nextAppointment)}
                    disabled={!nextAppointment.video_call_link}
                  >
                    {nextAppointment.video_call_link ? 'Join video call' : 'Waiting for link'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Form Modal */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{editingAppointment ? 'Reschedule Appointment' : 'Book New Appointment'}</CardTitle>
                  <button onClick={closeBookingForm} className="text-gray-500 hover:text-gray-700">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                {editingAppointment && (
                  <p className="mt-3 text-sm text-gray-500">
                    Report du rendez-vous initialement prévu pour {editingOriginalDate}
                    {editingOriginalTime ? ` à ${editingOriginalTime}` : ''}. Pour changer de médecin, annulez ce rendez-vous et prenez-en un nouveau.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Doctor Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sélectionnez un médecin *
                      </label>
                      <Select
                        value={selectedDoctor?.toString() || ''}
                        onChange={(e) => handleDoctorSelect(Number(e.target.value))}
                        disabled={Boolean(editingAppointment)}
                      >
                        <option value="">Choisissez un médecin</option>
                        {doctors.map(doctor => (
                          <option key={doctor.id} value={doctor.id}>
                            Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                          </option>
                        ))}
                      </Select>
                      {editingAppointment && (
                        <p className="mt-1 text-xs text-gray-500">
                          Les changements de médecin nécessitent l'annulation et la réservation d'un nouveau rendez-vous.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de rendez-vous *
                      </label>
                      <Select
                        value={appointmentType}
                        onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                      >
                        <option value={AppointmentType.IN_PERSON}>Visite en personne</option>
                        <option value={AppointmentType.VIDEO_CALL}>Consultation vidéo</option>
                        <option value={AppointmentType.PHONE_CALL}>Consultation téléphonique</option>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motif de consultation *
                      </label>
                      <Input
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        placeholder="Brève description de votre préoccupation"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Remarques supplémentaires
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={3}
                        placeholder="Informations supplémentaires"
                      />
                    </div>
                  </div>

                  {/* Calendar and Time Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sélectionnez une date *
                      </label>
                      <div className="bg-white border rounded-lg p-4">
                        {/* Calendar Header */}
                        <div className="flex justify-between items-center mb-4">
                          <button onClick={() => navigateMonth('prev')} className="p-1 hover:bg-gray-100 rounded">
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <div className="font-semibold">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                          </div>
                          <button onClick={() => navigateMonth('next')} className="p-1 hover:bg-gray-100 rounded">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-xs font-semibold text-gray-600 p-2">
                              {day}
                            </div>
                          ))}
                          {renderCalendar()}
                        </div>
                      </div>
                    </div>

                    {/* Available Time Slots */}
                    {selectedDate && selectedDoctor && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Créneaux horaires disponibles *
                        </label>
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {availableSlots.map(slot => (
                            <button
                              key={slot}
                              onClick={() => setSelectedSlot(slot)}
                              className={`
                                px-3 py-2 text-sm rounded-lg border transition-colors
                                ${selectedSlot === slot 
                                  ? 'bg-primary text-white border-primary' 
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                                }
                              `}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button variant="outline" onClick={closeBookingForm}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBookAppointment}
                    disabled={!selectedDoctor || !selectedDate || !selectedSlot || !chiefComplaint}
                  >
                    {editingAppointment ? 'Mise à jour du rendez-vous' : 'Prendre rendez-vous'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Appointments List */}
        <div className="space-y-6">
          {/* Filter */}
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'all')}
              className="w-48"
            >
              <option value="all">Tous les rendez-vous</option>
              <option value={AppointmentStatus.PENDING}>{APPOINTMENT_STATUS_LABELS[AppointmentStatus.PENDING]}</option>
              <option value={AppointmentStatus.CONFIRMED}>{APPOINTMENT_STATUS_LABELS[AppointmentStatus.CONFIRMED]}</option>
              <option value={AppointmentStatus.COMPLETED}>{APPOINTMENT_STATUS_LABELS[AppointmentStatus.COMPLETED]}</option>
              <option value={AppointmentStatus.CANCELLED}>{APPOINTMENT_STATUS_LABELS[AppointmentStatus.CANCELLED]}</option>
            </Select>
          </div>

          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun rendez-vous trouvé</p>
                <Button onClick={handleStartBooking} className="mt-4">
                  Prendre votre premier rendez-vous
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAppointments.map(appointment => (
                <Card key={appointment.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {getStatusBadge(appointment.status)}
                          <div className="flex items-center text-sm text-gray-600">
                            {getTypeIcon(appointment.appointment_type)}
                            <span className="ml-1">{getTypeLabel(appointment.appointment_type)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center text-gray-700 mb-2">
                              <User className="w-4 h-4 mr-2" />
                              <span className="font-medium">
                                Dr. {appointment.doctor?.first_name} {appointment.doctor?.last_name}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-600 text-sm">
                              <span className="ml-6">{appointment.doctor?.specialization}</span>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center text-gray-700 mb-2">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              <span>{formatShortDate(appointment.appointment_date)}</span>
                              <Clock className="w-4 h-4 ml-4 mr-2" />
                              <span>{formatTimeValue(appointment.appointment_date, appointment.appointment_time)}</span>
                            </div>
                          </div>
                        </div>

                        {appointment.reason && (
                          <div className="mt-3 text-sm text-gray-600">
                            <span className="font-medium">Raison:</span> {appointment.reason}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 ml-4">
                        {canReschedule(appointment) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openBookingFormForEdit(appointment)}
                            disabled={editingAppointment?.id === appointment.id}
                          >
                            {editingAppointment?.id === appointment.id ? 'Editing…' : 'Reschedule'}
                          </Button>
                        )}
                        {appointment.status === AppointmentStatus.PENDING && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={cancellingId === appointment.id}
                          >
                            {cancellingId === appointment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Cancel'
                            )}
                          </Button>
                        )}
                        {appointment.status === AppointmentStatus.CONFIRMED && appointment.appointment_type === AppointmentType.VIDEO_CALL && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleJoinVideoCall(appointment)}
                            disabled={!appointment.video_call_link}
                          >
                            {appointment.video_call_link ? "Rejoindre l'appel vidéo" : 'En attente du lien'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type StatAccent = 'primary' | 'secondary' | 'success' | 'danger';

function SummaryStatCard({ title, subtitle, value, icon, accent = 'primary' }: {
  title: string;
  subtitle: string;
  value: number;
  icon: ReactNode;
  accent?: StatAccent;
}) {
  const accentClasses: Record<StatAccent, string> = {
    primary: 'from-primary-50 to-primary-100 border-primary-100',
    secondary: 'from-blue-50 to-blue-100 border-blue-100',
    success: 'from-green-50 to-green-100 border-green-100',
    danger: 'from-red-50 to-red-100 border-red-100',
  };

  return (
    <Card className={`border-2 bg-gradient-to-br ${accentClasses[accent]}`}>
      <CardContent className="py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{subtitle}</p>
            <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-1">{title}</p>
          </div>
          <div className="p-3 bg-white/70 rounded-xl shadow-sm">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function extractItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object') {
    const items = (payload as { items?: unknown }).items;
    if (Array.isArray(items)) {
      return items as T[];
    }
  }

  return [];
}

function dedupeById<T extends { id?: number | string }>(items: T[]): T[] {
  const map = new Map<number | string, T>();
  for (const item of items) {
    if (item?.id == null) {
      continue;
    }
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

function toDate(dateValue?: string | Date | null, timeValue?: string | null): Date | null {
  if (!dateValue) {
    return null;
  }

  const baseDate = new Date(dateValue);
  if (Number.isNaN(baseDate.getTime())) {
    return null;
  }

  if (timeValue && typeof timeValue === 'string' && timeValue.includes(':')) {
    const [hours, minutes] = timeValue.split(':').map((segment) => Number.parseInt(segment, 10));
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      const adjusted = new Date(baseDate);
      adjusted.setHours(hours, minutes, 0, 0);
      return adjusted;
    }
  }

  return baseDate;
}

const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'En attente',
  [AppointmentStatus.CONFIRMED]: 'Confirmé',
  [AppointmentStatus.COMPLETED]: 'Complété',
  [AppointmentStatus.CANCELLED]: 'Annulé',
  [AppointmentStatus.NO_SHOW]: 'Non-présent',
};

const APPOINTMENT_STATUS_STYLES: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [AppointmentStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
  [AppointmentStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [AppointmentStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [AppointmentStatus.NO_SHOW]: 'bg-orange-100 text-orange-800',
};

const APPOINTMENT_STATUS_ICONS: Record<AppointmentStatus, LucideIcon> = {
  [AppointmentStatus.PENDING]: AlertCircle,
  [AppointmentStatus.CONFIRMED]: CheckCircle,
  [AppointmentStatus.COMPLETED]: CheckCircle,
  [AppointmentStatus.CANCELLED]: XCircle,
  [AppointmentStatus.NO_SHOW]: AlertCircle,
};

const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  [AppointmentType.IN_PERSON]: 'Visite en personne',
  [AppointmentType.VIDEO_CALL]: 'Consultation vidéo',
  [AppointmentType.PHONE_CALL]: 'Consultation téléphonique',
};

function formatLongDate(dateValue?: string | Date | null): string {
  const date = toDate(dateValue);
  if (!date) {
    return '';
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatShortDate(dateValue?: string | Date | null): string {
  const date = toDate(dateValue);
  if (!date) {
    return '';
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeValue(dateValue?: string | Date | null, timeValue?: string | null): string {
  const date = toDate(dateValue, timeValue);
  if (!date) {
    return timeValue ?? '';
  }

  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
