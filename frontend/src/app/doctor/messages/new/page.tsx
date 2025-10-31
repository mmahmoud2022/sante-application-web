/**
 * Doctor New Message Page
 * Allows doctors to send a new message to a patient
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { User } from '@/types';
import { 
  ArrowLeft, 
  Search, 
  Send, 
  User as UserIcon,
  Mail,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

const SEARCH_DEBOUNCE_MS = 300;

export default function DoctorNewMessagePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<User[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'doctor')) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === 'doctor') {
      loadPatients();
    }
  }, [user]);

  const loadPatients = async () => {
    try {
      setLoadingPatients(true);
      // Get all patients (this assumes there's an endpoint to list patients)
      // You might need to adjust this based on your actual API
      const response = await api.appointments.list({ doctor_id: user?.id });
      
      // Extract unique patients from appointments
      const uniquePatients = new Map<number, User>();
      response.data.forEach((appointment: any) => {
        if (appointment.patient && !uniquePatients.has(appointment.patient.id)) {
          uniquePatients.set(appointment.patient.id, appointment.patient);
        }
      });
      
      setPatients(Array.from(uniquePatients.values()));
    } catch (error) {
      console.error('Failed to load patients:', error);
      setError('Impossible de charger la liste des patients.');
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      setError('Veuillez sélectionner un patient.');
      return;
    }

    if (!message.trim()) {
      setError('Le message ne peut pas être vide.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await api.messages.sendMessage({
        recipient_id: selectedPatient.id,
        subject: subject.trim() || undefined,
        content: message.trim(),
      });

      setSuccess('Message envoyé avec succès ! Redirection en cours...');
      setSubject('');
      setMessage('');
      setSelectedPatient(null);

      setTimeout(() => {
        router.push('/doctor/messages');
      }, 1500);
    } catch (sendError) {
      console.error('Failed to send message:', sendError);
      setError("Échec de l'envoi du message. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPatients = useMemo<User[]>(() => {
    if (!searchTerm) {
      return patients;
    }

    const term = searchTerm.toLowerCase();
    return patients.filter((patient: User) => {
      const fullName = `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.toLowerCase();
      const email = patient.email?.toLowerCase() ?? '';
      return fullName.includes(term) || email.includes(term);
    });
  }, [patients, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Link href="/doctor/messages">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <Link href="/doctor/dashboard">
                <Button variant="outline" size="sm">
                  Tableau de bord
                </Button>
              </Link>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <MessageSquare className="w-8 h-8 mr-3 text-primary" />
                Nouveau Message
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Envoyer un message à un patient
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Selection */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Sélectionner un Patient
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Rechercher un patient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Patient List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {loadingPatients ? (
                  <div className="text-center py-8 text-gray-500">
                    Chargement des patients...
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'Aucun patient trouvé' : 'Aucun patient disponible'}
                  </div>
                ) : (
                  filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setError(null);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedPatient?.id === patient.id
                          ? 'bg-primary-50 border-primary-300 ring-2 ring-primary-500'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {patient.email}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Message Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Composer le Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedPatient ? (
                <div className="text-center py-16 text-gray-500">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Sélectionnez un patient</p>
                  <p className="text-sm mt-2">
                    Choisissez un patient dans la liste pour commencer à écrire
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Selected Patient Info */}
                  <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                    <p className="text-sm font-medium text-gray-700">Destinataire :</p>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{selectedPatient.email}</p>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Sujet (optionnel)
                    </label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="Ex: Résultats d'analyse, Suivi post-consultation..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={submitting}
                      maxLength={200}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      placeholder="Écrivez votre message ici..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={submitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      rows={10}
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {message.length} caractères
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">Conseils :</p>
                        <ul className="space-y-1 text-blue-800">
                          <li>• Soyez clair et professionnel</li>
                          <li>• Évitez le jargon médical complexe</li>
                          <li>• Le patient recevra une notification</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/doctor/messages')}
                      disabled={submitting}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || !message.trim()}
                      className="flex-1"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Envoyer le Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">💡 Bonnes Pratiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900 mb-2">✅ À faire :</p>
                <ul className="space-y-1">
                  <li>• Utiliser un langage simple et compréhensible</li>
                  <li>• Être concis et aller à l'essentiel</li>
                  <li>• Répondre dans les 24-48 heures</li>
                  <li>• Relire avant d'envoyer</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-2">❌ À éviter :</p>
                <ul className="space-y-1">
                  <li>• Utiliser trop de termes médicaux</li>
                  <li>• Traiter les urgences par message</li>
                  <li>• Partager des informations sensibles</li>
                  <li>• Messages trop longs ou complexes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
