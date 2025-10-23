'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  FileText,
  Pill,
  Heart,
  User,
  LogOut,
  Bell,
  Search,
  Clock,
  ChevronRight,
  Activity,
  CalendarCheck,
  AlertCircle,
  MessageSquare,
  Stethoscope,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Carousel } from '@/components/ui/Carousel';
//import { HealthMetrics } from '@/components/ui/HealthMetrics';
import api from '@/lib/api';
import logger from '@/lib/logger';
import { Appointment, AppointmentStatus, AppointmentType, Document, MedicalRecord, Prescription } from '@/types';

/**
 * PatientDashboard.tsx
 * Single-file refactor of your dashboard with:
 *  - deduplication of items
 *  - small reusable internal components
 *  - safer useEffect and performance optimizations
 */

export default function PatientDashboard() {
  const { user, logout, loading: loadingAuth } = useAuth();
  const router = useRouter();

  // Data state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [medicalRecordCount, setMedicalRecordCount] = useState(0);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<number | null>(null);

  // UI state for top-level spinner (auth)
  const showAuthSpinner = loadingAuth || !user;

  // Load dashboard data: memoized to avoid re-creation
  const loadDashboardData = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoadingError(null);
    setLoadingData(true);

    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const results = await Promise.allSettled([
        api.appointments.list({ limit: 30, include: 'doctor' }),
        api.prescriptions.list({ limit: 30, status: 'active' }),
        api.documents.list({ limit: 20, patient_id: user.id }),
        api.medicalRecords.getByPatient(user.id),
      ]);

      const [appointmentsRes, prescriptionsRes, documentsRes, medicalRecordsRes] = results;

      const nextAppointments =
        appointmentsRes.status === 'fulfilled'
          ? extractItems<Appointment>(appointmentsRes.value.data)
          : null;

      const nextPrescriptions =
        prescriptionsRes.status === 'fulfilled'
          ? extractItems<Prescription>(prescriptionsRes.value.data)
          : null;

      const nextDocuments =
        documentsRes.status === 'fulfilled'
          ? extractItems<Document>(documentsRes.value.data)
          : null;

      const nextMedicalRecords =
        medicalRecordsRes.status === 'fulfilled'
          ? extractItems<MedicalRecord>(medicalRecordsRes.value.data)
          : null;

      const hasFailure = [appointmentsRes, prescriptionsRes, documentsRes, medicalRecordsRes].some(
        (res) => res.status === 'rejected'
      );

      if (nextAppointments) {
        const normalizedAppointments = dedupeById<Appointment>(
          nextAppointments.map((appointment) => normalizeAppointment(appointment))
        );
        setAppointments(normalizedAppointments);
      }
      if (nextPrescriptions) {
        setPrescriptions(dedupeById<Prescription>(nextPrescriptions));
      }
      if (nextDocuments) {
        setDocuments(dedupeById<Document>(nextDocuments));
      }
      if (nextMedicalRecords) {
        setMedicalRecordCount(nextMedicalRecords.length);
      }

      if (!hasFailure) {
        setLoadingData(false);
        return;
      }

      logger.warn('Partial dashboard data load failure', {
        attempt: attempt + 1,
        userId: user.id,
        appointmentsLoaded: Boolean(nextAppointments),
        prescriptionsLoaded: Boolean(nextPrescriptions),
        documentsLoaded: Boolean(nextDocuments),
        medicalRecordsLoaded: Boolean(nextMedicalRecords),
      });

      if (attempt < maxAttempts - 1) {
        await sleep(500 * 2 ** attempt);
        continue;
      }

      if (!nextAppointments && !nextPrescriptions && !nextDocuments && !nextMedicalRecords) {
        setLoadingError(
          "Impossible de charger toutes les données patient. Veuillez vérifier votre connexion et réessayer."
        );
      } else {
        setLoadingError(
          'Certaines informations n’ont pas pu être chargées. Les données disponibles sont affichées, réessayez dans quelques instants.'
        );
      }

      setLoadingData(false);
      return;
    }
  }, [user]);

  // Auth + initial load: only react to meaningful changes
  useEffect(() => {
    if (loadingAuth) return;

    if (!user || user.role !== 'patient') {
      router.push('/login');
      return;
    }

    // Once authenticated, load data
    loadDashboardData();

    // optional: refetch every X minutes if desired: use interval
    // const interval = setInterval(loadDashboardData, 1000 * 60 * 5);
    // return () => clearInterval(interval);

  }, [loadingAuth, user, router, loadDashboardData]);

  // Derived values
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const aDate = toDateTime(a.appointment_date) ?? new Date(0);
      const bDate = toDateTime(b.appointment_date) ?? new Date(0);
      return aDate.getTime() - bDate.getTime();
    });
  }, [appointments]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return sortedAppointments.filter((apt) => {
      const status = apt.status as AppointmentStatus;
      if (![AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING].includes(status)) {
        return false;
      }

      const appointmentDate = toDateTime(apt.appointment_date);
      if (!appointmentDate) {
        return false;
      }

      return appointmentDate >= now || isSameDayDate(appointmentDate, now);
    });
  }, [sortedAppointments]);

  const pastAppointments = useMemo(() => {
    const now = new Date();
    return sortedAppointments
      .filter((apt) => {
        const status = apt.status as AppointmentStatus;
        const appointmentDate = toDateTime(apt.appointment_date);
        if (!appointmentDate) {
          return false;
        }
        return appointmentDate < now && !isSameDayDate(appointmentDate, now) && status !== AppointmentStatus.CANCELLED;
      })
      .slice(-5)
      .reverse();
  }, [sortedAppointments]);

  const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

  const todayAppointmentsCount = useMemo(() => {
    const today = new Date();
    return upcomingAppointments.filter((apt) => {
      const appointmentDate = toDateTime(apt.appointment_date);
      return appointmentDate ? isSameDayDate(appointmentDate, today) : false;
    }).length;
  }, [upcomingAppointments]);

  const dashboardStats = useMemo(() => ({
    totalAppointments: appointments.length,
    upcomingAppointments: upcomingAppointments.length,
    todayAppointments: todayAppointmentsCount,
    activePrescriptions: prescriptions.length,
    documentsCount: documents.length,
  }), [appointments.length, upcomingAppointments.length, todayAppointmentsCount, prescriptions.length, documents.length]);

  const documentHighlights = useMemo(() => documents.slice(0, 3), [documents]);

  // Handlers
  const handleLogout = useCallback(async () => {
    try {
      await logout?.();
      router.push('/login');
    } catch (err) {
      logger.error('Logout failed', { error: err });
    }
  }, [logout, router]);

  const handleCancelAppointment = useCallback(
    async (appointment: Appointment) => {
      const confirmCancel = window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?');
      if (!confirmCancel) {
        return;
      }

      setCancellingAppointmentId(appointment.id);
      try {
        await api.appointments.cancel(
          appointment.id,
          'Annulation effectuée depuis le tableau de bord patient'
        );
        await loadDashboardData();
      } catch (error: any) {
        setLoadingError("Impossible d'annuler ce rendez-vous. Veuillez réessayer.");
        logger.error('Failed to cancel appointment from patient dashboard', {
          appointmentId: appointment.id,
          userId: user?.id,
          errorMessage: error?.message,
        }, error);
      } finally {
        setCancellingAppointmentId(null);
      }
    },
    [loadDashboardData, user?.id]
  );

  // If still authenticating or user not present show spinner
  if (showAuthSpinner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50 backdrop-blur-md bg-white/60 dark:bg-neutral-900/60 border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-primary-500 to-secondary-500 p-2 rounded-xl shadow-medical">
                <Heart className="h-6 w-6 text-white" fill="white" />
              </div>
              <span className="text-2xl font-heading font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Santé
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                aria-label="Notifications"
                title="Notifications"
                className="relative p-2.5 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
              >
                <Bell className="h-6 w-6" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-warm-coral rounded-full ring-2 ring-white animate-pulse" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">Patient</p>
                </div>
                <button
                  onClick={handleLogout}
                  aria-label="Se déconnecter"
                  title="Se déconnecter"
                  className="p-2.5 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-neutral-800 dark:text-neutral-100 mb-2">
            Bonjour, {user.first_name} 👋
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">Bienvenue sur votre espace personnel</p>
        </div>

        {loadingError && (
          <div className="mb-8">
            <div className="border border-red-200 dark:border-red-600/60 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-2xl px-5 py-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{loadingError}</p>
                <p className="text-xs opacity-80">Réessayez dans quelques instants.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            title="Consultations"
            subtitle="Total"
            value={dashboardStats.totalAppointments}
            icon={<Calendar className="h-6 w-6 text-primary-600" />}
          />
          <SummaryCard
            title="À venir"
            subtitle="Aujourd'hui"
            value={dashboardStats.todayAppointments}
            accent="secondary"
            icon={<Clock className="h-6 w-6 text-secondary-600" />}
          />
          <SummaryCard
            title="Ordonnances"
            subtitle="Actives"
            value={dashboardStats.activePrescriptions}
            accent="warm"
            icon={<Pill className="h-6 w-6 text-warm-coral" />}
          />
          <SummaryCard
            title="Documents"
            subtitle="Stockés"
            value={dashboardStats.documentsCount}
            accent="purple"
            icon={<FileText className="h-6 w-6 text-accent-purple" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <QuickActionCard
            title="Trouver un médecin"
            subtitle="Rechercher et prendre RDV"
            onClick={() => router.push('/patient/search-doctors')}
            icon={<Search className="h-6 w-6 text-primary-600 dark:text-primary-400" />}
          />
          <QuickActionCard
            title="Mes rendez-vous"
            subtitle={`${upcomingAppointments.length} à venir`}
            onClick={() => router.push('/patient/appointments')}
            icon={<Calendar className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />}
          />
          <QuickActionCard
            title="Dossier médical"
            subtitle={medicalRecordCount > 0 ? `${medicalRecordCount} ${medicalRecordCount > 1 ? 'entrées' : 'entrée'}` : 'Aucun enregistrement'}
            onClick={() => router.push('/patient/medical-records')}
            icon={<FileText className="h-6 w-6 text-accent-purple" />}
          />
          <QuickActionCard
            title="Ordonnances"
            subtitle={`${dashboardStats.activePrescriptions} actives`}
            onClick={() => router.push('/patient/prescriptions')}
            icon={<Pill className="h-6 w-6 text-accent-teal" />}
          />
        </div>

        
        {/* Health Metrics */}
        <div className="mb-8">
          {/* <HealthMetrics /> */}
        </div>
        

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Appointments */}
            <Card className="glass-card border-2 border-primary-100 dark:border-primary-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg">
                      <CalendarCheck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span>Prochains rendez-vous</span>
                  </CardTitle>
                  <button
                    onClick={() => router.push('/patient/appointments')}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold px-4 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                  >
                    Voir tout
                  </button>
                </div>
              </CardHeader>

              <CardContent>
                {loadingData ? (
                  <div className="text-center py-8">
                    <Spinner />
                  </div>
                ) : upcomingAppointments.length > 0 ? (
                  <Carousel itemsPerView={1} showIndicators autoPlay>
                    {upcomingAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border-2 border-primary-100 dark:border-primary-800 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-900/20 rounded-xl p-6 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
                                <Stethoscope className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-neutral-800 dark:text-neutral-100">
                                  Dr. {appointment.doctor?.first_name} {appointment.doctor?.last_name}
                                </h4>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                  {appointment.doctor?.specialization || 'Médecin'}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="flex items-center gap-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 py-1.5 rounded-full font-medium">
                                <Calendar className="h-4 w-4" />
                                {formatDate(appointment.appointment_date)}
                              </span>
                              <span className="flex items-center gap-1 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 px-3 py-1.5 rounded-full font-medium">
                                <Clock className="h-4 w-4" />
                                {appointment.appointment_time || formatTime(appointment.appointment_date)}
                              </span>
                              <span className="flex items-center gap-1 bg-white/70 dark:bg-neutral-900/40 border border-primary-100 dark:border-primary-800 px-3 py-1.5 rounded-full font-medium text-sm">
                                {APPOINTMENT_TYPE_LABELS[appointment.appointment_type as AppointmentType] || 'Consultation'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                              {appointment.reason && <span>Motif : {appointment.reason}</span>}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => router.push('/patient/appointments')}>
                                Voir les détails
                              </Button>
                              {[AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING].includes(appointment.status as AppointmentStatus) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCancelAppointment(appointment)}
                                  disabled={cancellingAppointmentId === appointment.id}
                                >
                                  {cancellingAppointmentId === appointment.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Annuler'
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="md:w-32">
                            <StatusBadge status={appointment.status as AppointmentStatus} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </Carousel>
                ) : (
                  <EmptyState
                    icon={<Calendar className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />}
                    title="Aucun rendez-vous à venir"
                    actionText="Prendre un rendez-vous"
                    onAction={() => router.push('/patient/search-doctors')}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="glass-card border-2 border-neutral-100 dark:border-neutral-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800 rounded-lg">
                    <Activity className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
                  </div>
                  <span>Historique récent</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-6">
                    <Spinner />
                  </div>
                ) : pastAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {pastAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="border border-neutral-100 dark:border-neutral-800 rounded-xl px-4 py-3 bg-white/70 dark:bg-neutral-900/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                              Dr. {appointment.doctor?.first_name} {appointment.doctor?.last_name}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {formatDateShort(appointment.appointment_date)} · {appointment.appointment_time || formatTime(appointment.appointment_date)}
                            </p>
                            {appointment.diagnosis && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                Diagnostic : {appointment.diagnosis}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={appointment.status as AppointmentStatus} compact />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Activity className="h-10 w-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />}
                    title="Aucune consultation récente"
                    description="Vos dernières visites apparaîtront ici."
                  />
                )}
              </CardContent>
            </Card>

            {/* Messages Card */}
            <Card className="glass-card border-2 border-secondary-100 dark:border-secondary-800 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-900 dark:to-secondary-800 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <span>Messages avec vos médecins</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <MessageSquare className="h-10 w-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    Communiquez facilement avec vos praticiens
                  </p>
                  <Button size="sm" variant="outline" onClick={() => router.push('/patient/messages/new')}>
                    Nouveau message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Column */}
          <div className="space-y-6">
            {nextAppointment && (
              <Card className="glass-card border-2 border-primary-100 dark:border-primary-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      <CalendarCheck className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span>Prochain rendez-vous</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Date</p>
                    <p className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
                      {formatDate(nextAppointment.appointment_date)}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {nextAppointment.appointment_time || formatTime(nextAppointment.appointment_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Médecin</p>
                    <p className="text-base font-medium text-neutral-800 dark:text-neutral-100">
                      Dr. {nextAppointment.doctor?.first_name} {nextAppointment.doctor?.last_name}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {nextAppointment.doctor?.specialization || 'Médecin généraliste'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="flex items-center gap-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 py-1.5 rounded-full font-medium">
                      {APPOINTMENT_TYPE_LABELS[nextAppointment.appointment_type as AppointmentType] || 'Consultation'}
                    </span>
                    <StatusBadge status={nextAppointment.status as AppointmentStatus} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" fullWidth onClick={() => router.push('/patient/appointments')}>
                      Gérer les rendez-vous
                    </Button>
                    {[AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING].includes(nextAppointment.status as AppointmentStatus) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancelAppointment(nextAppointment)}
                        disabled={cancellingAppointmentId === nextAppointment.id}
                      >
                        {cancellingAppointmentId === nextAppointment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Annuler'
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Medication Reminders */}
            <Card className="glass-card border-2 border-warm-coral/30 shadow-warm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-warm-coral/20 to-warm-coral/10 rounded-lg">
                    <Pill className="h-5 w-5 text-warm-coral" />
                  </div>
                  <span>Rappels médicaments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-4">
                    <Spinner />
                  </div>
                ) : prescriptions.length > 0 ? (
                  <div className="space-y-3">
                    {prescriptions.slice(0, 3).map((prescription) => (
                      <div
                        key={prescription.id}
                        className="border-l-4 border-warm-coral bg-gradient-to-r from-warm-coral/10 to-transparent pl-3 py-3 rounded-r-lg hover:from-warm-coral/20 transition-all"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
                            {prescription.medication_name}
                          </h5>
                          <span className="text-xs bg-warm-coral/20 text-warm-coral px-2 py-0.5 rounded-full font-bold">
                            Actif
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                          {prescription.dosage}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                          {prescription.frequency}
                        </p>
                      </div>
                    ))}

                    <button
                      onClick={() => router.push('/patient/prescriptions')}
                      className="w-full text-sm text-warm-coral hover:text-warm-coral/80 font-semibold py-2 hover:bg-warm-coral/10 rounded-lg transition-all"
                    >
                      Voir toutes les ordonnances →
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center py-4">
                    Aucune ordonnance active
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card border-2 border-accent-purple/30 dark:border-accent-purple/40">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-accent-purple/20 to-accent-purple/10 rounded-lg">
                    <FileText className="h-5 w-5 text-accent-purple" />
                  </div>
                  <span>Documents récents</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-4">
                    <Spinner />
                  </div>
                ) : documentHighlights.length > 0 ? (
                  <div className="space-y-3">
                    {documentHighlights.map((document) => (
                      <div
                        key={document.id}
                        className="border border-accent-purple/30 dark:border-accent-purple/40 rounded-xl px-4 py-3 bg-white/60 dark:bg-neutral-900/40"
                      >
                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                          {document.title}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {formatDocumentType(document.document_type)} · {formatDateShort(document.created_at)}
                        </p>
                      </div>
                    ))}
                    <button
                      onClick={() => router.push('/patient/medical-records')}
                      className="w-full text-sm text-accent-purple hover:text-accent-purple/80 font-semibold py-2 hover:bg-accent-purple/10 rounded-lg transition-all"
                    >
                      Accéder à tous les documents →
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center py-4">
                    Aucun document enregistré pour le moment
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Health Stats */}
            <Card className="glass-card border-2 border-purple-100 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-lg">
                    <Activity className="h-5 w-5 text-accent-purple" />
                  </div>
                  <span>Vue d&apos;ensemble</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <InfoRow icon={<Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />} label="Consultations" value={`${dashboardStats.totalAppointments}`} />
                  <InfoRow icon={<CalendarCheck className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />} label="À venir" value={`${dashboardStats.upcomingAppointments}`} />
                  <InfoRow icon={<Pill className="h-4 w-4 text-warm-coral" />} label="Ordonnances actives" value={`${dashboardStats.activePrescriptions}`} />
                  <InfoRow icon={<FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />} label="Documents" value={`${dashboardStats.documentsCount}`} />
                </div>
              </CardContent>
            </Card>

            {/* Profile Completion */}
            <Card className="glass-card bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-2 border-primary-200 dark:border-primary-700 shadow-medical">
              <CardContent className="py-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-primary-500 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-1">Complétez votre profil</h5>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      Ajoutez vos informations médicales pour une meilleure prise en charge
                    </p>
                    <Button size="sm" onClick={() => router.push('/patient/profile')}>
                      Compléter mon profil
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------
   Helper utilities & small internal components
   --------------------------- */

type DateInput = string | Date | null | undefined;

const KNOWN_APPOINTMENT_TYPES = new Set(Object.values(AppointmentType));
const KNOWN_APPOINTMENT_STATUSES = new Set(Object.values(AppointmentStatus));

function normalizeAppointmentType(value: unknown): AppointmentType {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (KNOWN_APPOINTMENT_TYPES.has(normalized as AppointmentType)) {
      return normalized as AppointmentType;
    }
    if (['video', 'telehealth'].includes(normalized)) {
      return AppointmentType.VIDEO_CALL;
    }
    if (['phone', 'home_visit', 'homevisit', 'phone_call'].includes(normalized)) {
      return AppointmentType.PHONE_CALL;
    }
  }

  if (value && KNOWN_APPOINTMENT_TYPES.has(value as AppointmentType)) {
    return value as AppointmentType;
  }

  return AppointmentType.IN_PERSON;
}

function normalizeAppointmentStatus(value: unknown): AppointmentStatus {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (KNOWN_APPOINTMENT_STATUSES.has(normalized as AppointmentStatus)) {
      return normalized as AppointmentStatus;
    }
    if (normalized === 'canceled') {
      return AppointmentStatus.CANCELLED;
    }
  }

  if (value && KNOWN_APPOINTMENT_STATUSES.has(value as AppointmentStatus)) {
    return value as AppointmentStatus;
  }

  return AppointmentStatus.PENDING;
}

function deriveTimeString(dateValue: DateInput): string | null {
  if (!dateValue) {
    return null;
  }

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function normalizeAppointment(appointment: Appointment): Appointment {
  const normalizedType = normalizeAppointmentType(appointment.appointment_type);
  const normalizedStatus = normalizeAppointmentStatus(appointment.status);
  const normalizedTime = appointment.appointment_time ?? deriveTimeString(appointment.appointment_date) ?? '';

  return {
    ...appointment,
    appointment_type: normalizedType,
    status: normalizedStatus,
    appointment_time: normalizedTime,
  };
}

const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  [AppointmentType.IN_PERSON]: 'Consultation au cabinet',
  [AppointmentType.VIDEO_CALL]: 'Téléconsultation',
  [AppointmentType.PHONE_CALL]: 'Consultation téléphonique',
};

const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'En attente',
  [AppointmentStatus.CONFIRMED]: 'Confirmé',
  [AppointmentStatus.COMPLETED]: 'Terminée',
  [AppointmentStatus.CANCELLED]: 'Annulé',
  [AppointmentStatus.NO_SHOW]: 'Non présenté',
};

const APPOINTMENT_STATUS_STYLES: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  [AppointmentStatus.CONFIRMED]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  [AppointmentStatus.COMPLETED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  [AppointmentStatus.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  [AppointmentStatus.NO_SHOW]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  lab_result: 'Résultat d’analyse',
  prescription: 'Ordonnance',
  medical_image: 'Imagerie médicale',
  report: 'Compte rendu',
  invoice: 'Facture',
  consent_form: 'Formulaire de consentement',
  insurance_document: 'Document d’assurance',
  vaccination_certificate: 'Certificat de vaccination',
  medical_certificate: 'Certificat médical',
  other: 'Document médical',
};

function toDateTime(value: DateInput): Date | null {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameDayDate(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

function formatDate(dateInput?: DateInput) {
  const date = toDateTime(dateInput);
  if (!date) {
    return '';
  }
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateShort(dateInput?: DateInput) {
  const date = toDateTime(dateInput);
  if (!date) {
    return '';
  }
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateInput?: DateInput) {
  if (!dateInput) {
    return '';
  }
  if (typeof dateInput === 'string' && dateInput.length === 5 && dateInput.includes(':')) {
    return dateInput;
  }
  const date = toDateTime(dateInput);
  if (!date) {
    return '';
  }
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDocumentType(documentType?: string | null) {
  if (!documentType) {
    return 'Document médical';
  }
  return DOCUMENT_TYPE_LABELS[documentType] ?? 'Document médical';
}

function formatAppointmentStatus(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS_LABELS[status] ?? status;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function extractItems<T>(responseData: unknown): T[] {
  if (Array.isArray(responseData)) {
    return responseData as T[];
  }

  if (responseData && typeof responseData === 'object') {
    const maybeItems = (responseData as { items?: T[] }).items;
    if (Array.isArray(maybeItems)) {
      return maybeItems;
    }
  }

  return [];
}

function dedupeById<T extends { id?: string | number }>(items: T[]): T[] {
  const map = new Map<string | number, T>();
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it?.id != null) {
      map.set(it.id, it);
    }
  }
  return Array.from(map.values());
}

function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8';
  return <div className={`animate-spin rounded-full ${dims} border-b-2 border-primary-500 mx-auto`} role="status" aria-label="Chargement" />;
}

function EmptyState({ icon, title, description, actionText, onAction }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    <div className="text-center py-8">
      {icon}
      <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mt-2">{title}</p>
      {description && <p className="text-neutral-600 dark:text-neutral-400 mt-2">{description}</p>}
      {actionText && onAction && (
        <div className="mt-4">
          <Button onClick={onAction} size="sm">{actionText}</Button>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, subtitle, value, icon, accent = 'primary' }: {
  title: string;
  subtitle: string;
  value: number;
  icon: React.ReactNode;
  accent?: 'primary' | 'secondary' | 'warm' | 'purple';
}) {
  const accentClasses: Record<'primary' | 'secondary' | 'warm' | 'purple', string> = {
    primary: 'from-primary-50 to-primary-100 border-primary-100',
    secondary: 'from-secondary-50 to-secondary-100 border-secondary-100',
    warm: 'from-warm-coral/10 to-warm-coral/5 border-warm-coral/40',
    purple: 'from-accent-purple/10 to-accent-purple/5 border-accent-purple/30',
  } as const;

  return (
    <Card className={`glass-card border-2 ${accentClasses[accent]}`}>
      <CardContent className="py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1">{subtitle}</p>
            <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{value.toLocaleString('fr-FR')}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{title}</p>
          </div>
          <div className="p-3 bg-white/60 dark:bg-neutral-900/40 rounded-xl shadow-sm">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status, compact = false }: { status: AppointmentStatus; compact?: boolean }) {
  const label = formatAppointmentStatus(status);
  const baseClasses = compact ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-xs font-semibold';
  return (
    <span className={`${baseClasses} rounded-full font-semibold shadow-sm ${APPOINTMENT_STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'}`}>
      {label}
    </span>
  );
}

function QuickActionCard({ title, subtitle, onClick, icon }: {
  title: string;
  subtitle?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-card p-6 rounded-2xl hover:shadow-large transition-all group text-left"
      aria-label={title}
      title={title}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-xl group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <ChevronRight className="h-5 w-5 text-neutral-400 dark:text-neutral-500 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
      </div>

      <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-1">{title}</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{subtitle}</p>
    </button>
  );
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0 border-neutral-100 dark:border-neutral-700">
      <div className="flex items-center space-x-2">
        {icon}
        <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
      </div>
      <span className="font-bold text-neutral-800 dark:text-neutral-100 bg-primary-100 dark:bg-primary-900/30 px-3 py-1 rounded-full text-sm">{value}</span>
    </div>
  );
}
