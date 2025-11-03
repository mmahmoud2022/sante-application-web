/**
 * Patient New Message Page
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { User } from '@/types';

const SEARCH_DEBOUNCE_MS = 300;

export default function PatientNewMessagePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState<User[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'patient')) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || user.role !== 'patient') {
      return;
    }

    let isCancelled = false;
    setLoadingDoctors(true);

    const timer = setTimeout(async () => {
      try {
        const response = await api.users.doctors({
          search: searchTerm || undefined,
          limit: 12,
        });

        if (isCancelled) {
          return;
        }

        const data: User[] = (Array.isArray(response.data)
          ? response.data
          : (response.data as any)?.items ?? []) as User[];

        setDoctors(data);

        if (!data.length) {
          setSelectedDoctor(null);
        } else if (
          !selectedDoctor ||
          !data.some((doctor: User) => doctor.id === selectedDoctor.id)
        ) {
          setSelectedDoctor(data[0]);
        }
      } catch (fetchError) {
        if (!isCancelled) {
          console.error('Failed to load doctors:', fetchError);
        }
      } finally {
        if (!isCancelled) {
          setLoadingDoctors(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, user, selectedDoctor]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedDoctor) {
      setError('Veuillez sélectionner un praticien.');
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
        recipient_id: selectedDoctor.id,
        subject: subject.trim() || undefined,
        content: message.trim(),
      });

      setSuccess('Message envoyé. Redirection en cours...');
      setSubject('');
      setMessage('');

      setTimeout(() => {
        router.push('/patient/messages');
      }, 800);
    } catch (sendError) {
      console.error('Failed to send message:', sendError);
      setError("Échec de l'envoi du message. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoctors = useMemo<User[]>(() => {
    if (!searchTerm) {
      return doctors;
    }

    const term = searchTerm.toLowerCase();
    return doctors.filter((doctor: User) => {
      const fullName = `${doctor.first_name ?? ''} ${doctor.last_name ?? ''}`.toLowerCase();
      const specialization = doctor.specialization?.toLowerCase() ?? '';
      const city = doctor.city?.toLowerCase() ?? '';
      return fullName.includes(term) || specialization.includes(term) || city.includes(term);
    });
  }, [doctors, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!user || user.role !== 'patient') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/patient/messages')}
          >
            &larr; Retour aux messages
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/patient/dashboard')}
          >
            Tableau de bord
          </Button>
        </div>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
          Nouveau message
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Sélectionnez un praticien et rédigez votre message pour démarrer la conversation.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,1fr]">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Rechercher un praticien
          </h2>
          <Input
            placeholder="Nom, spécialité ou ville"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <div className="mt-6 space-y-3">
            {loadingDoctors ? (
              <div className="text-gray-500 dark:text-gray-400">Recherche en cours...</div>
            ) : filteredDoctors.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
                Aucun praticien trouvé. Ajustez votre recherche ou réessayez plus tard.
              </div>
            ) : (
              filteredDoctors.map((doctor: User) => {
                const isSelected = selectedDoctor?.id === doctor.id;

                return (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/70 dark:border-primary-400 dark:bg-primary-900/20'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 dark:border-gray-700 dark:hover:border-primary-500 dark:hover:bg-primary-900/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {doctor.first_name} {doctor.last_name}
                        </p>
                        {doctor.specialization && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {doctor.specialization}
                          </p>
                        )}
                        {doctor.city && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {doctor.city}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-primary-600 dark:text-primary-300">
                        {isSelected ? 'Sélectionné' : 'Sélectionner'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Rédiger votre message
          </h2>

          {selectedDoctor ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">À</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Dr {selectedDoctor.first_name} {selectedDoctor.last_name}
                </p>
                {selectedDoctor.specialization && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedDoctor.specialization}
                  </p>
                )}
              </div>

              <Input
                placeholder="Sujet (optionnel)"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Écrivez votre message..."
                className="w-full rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical min-h-[160px]"
              />

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-200">
                  {success}
                </div>
              )}

              <Button type="submit" loading={submitting} disabled={submitting} className="w-full">
                Envoyer le message
              </Button>
            </form>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
              Sélectionnez un praticien pour commencer la rédaction de votre message.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
