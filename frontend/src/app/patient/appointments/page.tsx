/**
 * Appointment Booking Calendar Page
 * Allows patients to view and book appointments with doctors
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  MapPin, 
  Video,
  Home,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter
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
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  
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
  const [filterStatus, setFilterStatus] = useState<string>('all');

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
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, doctorsRes] = await Promise.all([
        api.appointments.list(),
        api.users.doctors()
      ]);

      const appointmentsList = Array.isArray(appointmentsRes.data) 
        ? appointmentsRes.data 
        : (appointmentsRes.data as any).items || [];
      
      const doctorsList = Array.isArray(doctorsRes.data) 
        ? doctorsRes.data 
        : (doctorsRes.data as any).items || [];

      setAppointments(appointmentsList);
      setDoctors(doctorsList);
    } catch (error: any) {
      logger.error('Failed to load data', {
        userId: user?.id,
        errorMessage: error?.message,
      }, error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async (doctorId: number, date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await api.appointments.getAvailableSlots(doctorId, dateStr);
      setAvailableSlots(response.data || []);
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
      setAvailableSlots(sampleSlots);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (selectedDoctor) {
      loadAvailableSlots(selectedDoctor, date);
    }
  };

  const handleDoctorSelect = (doctorId: number) => {
    setSelectedDoctor(doctorId);
    setSelectedSlot(null);
    if (selectedDate) {
      loadAvailableSlots(doctorId, selectedDate);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot || !chiefComplaint) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const appointmentData = {
        doctor_id: selectedDoctor,
        appointment_date: selectedDate.toISOString().split('T')[0],
        appointment_time: selectedSlot,
        appointment_type: appointmentType,
        chief_complaint: chiefComplaint,
        notes: notes || undefined,
      };

      await api.appointments.create(appointmentData);
      alert('Appointment booked successfully!');
      
      // Reset form
      setShowBookingForm(false);
      setSelectedDoctor(null);
      setSelectedDate(null);
      setSelectedSlot(null);
      setChiefComplaint('');
      setNotes('');
      
      // Reload appointments
      loadData();
    } catch (error: any) {
      logger.error('Failed to book appointment', {
        userId: user?.id,
        doctorId: selectedDoctor,
        date: selectedDate?.toISOString(),
        slot: selectedSlot,
        errorMessage: error?.message,
      }, error);
      alert(error.response?.data?.detail || 'Failed to book appointment');
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
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
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const icons = {
      pending: AlertCircle,
      confirmed: CheckCircle,
      completed: CheckCircle,
      cancelled: XCircle,
    };

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeIcon = (type: AppointmentType) => {
    switch (type) {
      case AppointmentType.VIDEO:
        return <Video className="w-4 h-4" />;
      case AppointmentType.HOME_VISIT:
        return <Home className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

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

  const filteredAppointments = appointments
    .filter(apt => filterStatus === 'all' || apt.status === filterStatus)
    .sort((a, b) => {
      // Sort by date and time, most recent first
      const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
      const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
      return dateB.getTime() - dateA.getTime();
    });

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
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 shadow-sm border-b dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">My Appointments</h1>
              <p className="text-gray-600 dark:text-neutral-400 mt-1">View and manage your appointments</p>
            </div>
            <Button onClick={() => setShowBookingForm(true)}>
              <CalendarIcon className="w-5 h-5 mr-2" />
              Book Appointment
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Booking Form Modal */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Book New Appointment</CardTitle>
                  <button onClick={() => setShowBookingForm(false)} className="text-gray-500 hover:text-gray-700">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Doctor Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Doctor *
                      </label>
                      <Select
                        value={selectedDoctor?.toString() || ''}
                        onChange={(e) => handleDoctorSelect(Number(e.target.value))}
                      >
                        <option value="">Choose a doctor</option>
                        {doctors.map(doctor => (
                          <option key={doctor.id} value={doctor.id}>
                            Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Appointment Type *
                      </label>
                      <Select
                        value={appointmentType}
                        onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                      >
                        <option value={AppointmentType.IN_PERSON}>In-Person Visit</option>
                        <option value={AppointmentType.VIDEO}>Video Consultation</option>
                        <option value={AppointmentType.HOME_VISIT}>Home Visit</option>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chief Complaint *
                      </label>
                      <Input
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        placeholder="Brief description of your concern"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={3}
                        placeholder="Any additional information"
                      />
                    </div>
                  </div>

                  {/* Calendar and Time Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Date *
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
                          Available Time Slots *
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
                  <Button variant="outline" onClick={() => setShowBookingForm(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBookAppointment}
                    disabled={!selectedDoctor || !selectedDate || !selectedSlot || !chiefComplaint}
                  >
                    Book Appointment
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
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-48"
            >
              <option value="all">All Appointments</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>

          {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No appointments found</p>
                <Button onClick={() => setShowBookingForm(true)} className="mt-4">
                  Book Your First Appointment
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
                            <span className="ml-1">{appointment.appointment_type.replace('_', ' ')}</span>
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
                              <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                              <Clock className="w-4 h-4 ml-4 mr-2" />
                              <span>{appointment.appointment_time}</span>
                            </div>
                          </div>
                        </div>

                        {appointment.chief_complaint && (
                          <div className="mt-3 text-sm text-gray-600">
                            <span className="font-medium">Reason:</span> {appointment.chief_complaint}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2 ml-4">
                        {appointment.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="danger"
                            onClick={() => handleCancelAppointment(appointment.id)}
                          >
                            Cancel
                          </Button>
                        )}
                        {appointment.status === 'confirmed' && appointment.appointment_type === 'video' && (
                          <Button size="sm" variant="primary">
                            Join Video Call
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
