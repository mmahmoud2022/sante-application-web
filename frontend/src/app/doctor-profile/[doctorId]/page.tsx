import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, GraduationCap, Languages, Mail, MapPin, Phone, Star } from 'lucide-react';

import api from '@/lib/api';
import type { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

async function fetchDoctor(doctorId: number): Promise<User> {
  try {
    const response = await api.users.getDoctor(doctorId);
    return response.data as User;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 404) {
      notFound();
    }
    throw error;
  }
}

const formatCurrency = (value?: number) => {
  if (typeof value !== 'number') {
    return null;
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatLanguages = (value?: string) => {
  if (!value) {
    return null;
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

interface DoctorProfilePageProps {
  params: {
    doctorId: string;
  };
}

export default async function DoctorProfilePage({ params }: DoctorProfilePageProps) {
  const doctorId = Number.parseInt(params.doctorId, 10);

  if (Number.isNaN(doctorId)) {
    notFound();
  }

  const doctor = await fetchDoctor(doctorId);

  const languages = formatLanguages(doctor.languages_spoken);
  const consultationFee = formatCurrency(doctor.consultation_fee);

  const primaryLinkClasses = 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 text-base font-semibold text-white shadow-medical transition-all duration-300 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-3 focus:ring-primary-500 focus:ring-offset-2';
  const outlineLinkClasses = 'inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary-500 px-6 py-3 text-base font-semibold text-primary-600 transition-all duration-300 hover:bg-primary-50 focus:outline-none focus:ring-3 focus:ring-primary-500 focus:ring-offset-2';

  return (
    <div className="min-h-screen bg-neutral-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/search-doctors" className="text-sm text-primary hover:underline">
            ← Retour à la recherche
          </Link>
        </div>

        <Card className="overflow-hidden shadow-md">
          <CardHeader className="bg-white border-b">
            <CardTitle className="text-2xl font-bold text-neutral-900">
              Dr. {doctor.first_name} {doctor.last_name}
            </CardTitle>
            <p className="text-sm text-neutral-600 mt-1">{doctor.specialization || 'Médecin'}</p>
          </CardHeader>

          <CardContent className="bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <section>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-2">À propos</h2>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    {doctor.bio || 'Ce médecin n’a pas encore complété sa biographie.'}
                  </p>
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-neutral-50">
                    <div className="flex items-center text-neutral-700 text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      {doctor.city ? `${doctor.city}${doctor.country ? `, ${doctor.country}` : ''}` : 'Localisation non spécifiée'}
                    </div>
                  </div>

                  {consultationFee && (
                    <div className="p-4 border rounded-lg bg-neutral-50">
                      <div className="flex items-center text-neutral-700 text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        Consultation : {consultationFee}
                      </div>
                    </div>
                  )}

                  {doctor.phone && (
                    <div className="p-4 border rounded-lg bg-neutral-50">
                      <div className="flex items-center text-neutral-700 text-sm">
                        <Phone className="h-4 w-4 mr-2 text-primary" />
                        {doctor.phone}
                      </div>
                    </div>
                  )}

                  {doctor.email && (
                    <div className="p-4 border rounded-lg bg-neutral-50">
                      <div className="flex items-center text-neutral-700 text-sm">
                        <Mail className="h-4 w-4 mr-2 text-primary" />
                        {doctor.email}
                      </div>
                    </div>
                  )}

                  {languages && languages.length > 0 && (
                    <div className="p-4 border rounded-lg bg-neutral-50 sm:col-span-2">
                      <div className="flex items-center text-neutral-700 text-sm mb-2">
                        <Languages className="h-4 w-4 mr-2 text-primary" />
                        Langues parlées
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {languages.map((language) => (
                          <span key={language} className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                            {language}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {doctor.education && (
                    <div className="p-4 border rounded-lg bg-neutral-50 sm:col-span-2">
                      <div className="flex items-center text-neutral-700 text-sm mb-2">
                        <GraduationCap className="h-4 w-4 mr-2 text-primary" />
                        Formation et certifications
                      </div>
                      <p className="text-sm text-neutral-700 whitespace-pre-line">{doctor.education}</p>
                    </div>
                  )}
                </section>
              </div>

              <aside className="space-y-6">
                <section className="border rounded-lg p-6 bg-primary-50">
                  <h3 className="text-lg font-semibold text-primary-900 mb-3">Prendre rendez-vous</h3>
                  <p className="text-sm text-primary-800 mb-4">
                    Réservez une consultation avec Dr. {doctor.last_name}. Connectez-vous ou créez un compte pour voir les disponibilités.
                  </p>
                  <Link
                    href={{ pathname: '/login', query: { redirect: `/patient/appointments?doctorId=${doctor.id}` } }}
                    className={primaryLinkClasses}
                  >
                    <Calendar className="h-4 w-4" />
                    Prendre rendez-vous
                  </Link>
                  <Link href="/search-doctors" className={`${outlineLinkClasses} mt-2`}>
                    Revenir à la liste
                  </Link>
                </section>

                <section className="border rounded-lg p-6 bg-white">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-3">Informations clés</h3>
                  <ul className="space-y-3 text-sm text-neutral-700">
                    {doctor.accepting_new_patients && (
                      <li className="flex items-center">
                        <Star className="h-4 w-4 mr-2 text-green-600" />
                        Accepte de nouveaux patients
                      </li>
                    )}
                    {typeof doctor.rating_average === 'number' && (
                      <li className="flex items-center">
                        <Star className="h-4 w-4 mr-2 text-yellow-500" />
                        {doctor.rating_average.toFixed(1)} / 5 ({doctor.rating_count || 0} avis)
                      </li>
                    )}
                    <li className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-neutral-500" />
                      Dernière mise à jour : {new Date(doctor.updated_at).toLocaleDateString('fr-FR')}
                    </li>
                  </ul>
                </section>
              </aside>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
