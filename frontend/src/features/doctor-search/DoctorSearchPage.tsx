"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  Star,
  Calendar,
  Heart,
  Filter,
  ChevronDown,
  X,
  DollarSign,
  User,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import api from "@/lib/api";
import logger from "@/lib/logger";
import { DoctorSearchFilters, User as UserType, UserRole } from "@/types";

const DEFAULT_FILTERS: DoctorSearchFilters = {
  search: "",
  specialization: "",
  city: "",
  min_rating: undefined,
  max_fee: undefined,
  accepting_new_patients: undefined,
};

interface DoctorSearchPageProps {
  isPatientView?: boolean;
}

export default function DoctorSearchPage({ isPatientView = false }: DoctorSearchPageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [doctors, setDoctors] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<DoctorSearchFilters>(() => ({ ...DEFAULT_FILTERS }));

  const loadDoctors = useCallback(async (overrideFilters?: DoctorSearchFilters) => {
    const appliedFilters = overrideFilters ?? filters;
    setLoading(true);
    try {
      const response = await api.users.doctors(appliedFilters);
      const doctorsList = Array.isArray(response.data)
        ? response.data
        : (response.data as { items?: UserType[] }).items ?? [];
      const verifiedDoctors = doctorsList.filter((doctor) => doctor.is_verified);
      setDoctors(verifiedDoctors);
    } catch (error: any) {
      logger.error(
        "Failed to load doctors",
        {
          userId: user?.id,
          filters: appliedFilters,
          errorMessage: error?.message,
        },
        error
      );
    } finally {
      setLoading(false);
    }
  }, [filters, user?.id]);

  const initialFetchRef = useRef(false);
  const lastUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const currentUserId = user?.id ?? null;

    if (!initialFetchRef.current) {
      loadDoctors();
      initialFetchRef.current = true;
      lastUserIdRef.current = currentUserId;
      return;
    }

    if (lastUserIdRef.current !== currentUserId) {
      lastUserIdRef.current = currentUserId;
      loadDoctors();
    }
  }, [authLoading, loadDoctors, user?.id]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadDoctors(filters);
  };

  const clearFilters = () => {
    const resetFilters = { ...DEFAULT_FILTERS };
    setFilters(resetFilters);
    loadDoctors(resetFilters);
  };

  const handleBookAppointment = (doctorId: number) => {
    const bookingPath = `/patient/book-appointment?doctor=${doctorId}`;

    if (user?.role === UserRole.PATIENT) {
      router.push(bookingPath);
      return;
    }

    router.push(`/login?redirect=${encodeURIComponent(bookingPath)}`);
  };

  const scrollToResults = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const element = document.getElementById("doctor-search-results");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const isAuthenticatedPatient = user?.role === UserRole.PATIENT;
  const canBookAppointment = isAuthenticatedPatient;
  const backDestination = isAuthenticatedPatient ? "/patient/dashboard" : "/";
  const backLabel = isAuthenticatedPatient ? "Retour au tableau de bord" : "Retour à l\u2019accueil";
  const currentPagePath = isPatientView ? "/patient/search-doctors" : "/search-doctors";
  const loginUrl = `/login?redirect=${encodeURIComponent(currentPagePath)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-neutral-50 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900">
      <header className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push(backDestination)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white transition hover:bg-white/30"
                aria-label="Retour"
              >
                <Heart className="h-6 w-6" />
              </button>
              <div>
                <span className="block text-xs uppercase tracking-widest text-white/80">Santé connect</span>
                <span className="text-2xl font-heading font-semibold">Votre réseau de spécialistes</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => router.push(backDestination)}
              >
                {backLabel}
              </Button>
              {!isPatientView && !user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white text-primary-600 hover:bg-white/90"
                  onClick={() => router.push(loginUrl)}
                >
                  Se connecter
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <section className="relative mb-10 overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur dark:border-neutral-700/60 dark:bg-neutral-800/70">
          <div className="absolute right-[-20%] top-[-40%] h-72 w-72 rounded-full bg-primary-200/70 blur-3xl dark:bg-primary-900/40" />
          <div className="absolute left-[-10%] bottom-[-30%] h-60 w-60 rounded-full bg-secondary-200/60 blur-3xl dark:bg-secondary-900/40" />
          <div className="relative grid gap-10 lg:grid-cols-[1.3fr,0.7fr]">
            <div>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-700 dark:text-primary-300">
                Nouvelle expérience patient
              </span>
              <h1 className="mt-4 text-3xl font-heading font-bold text-neutral-900 sm:text-4xl lg:text-5xl dark:text-neutral-50">
                Trouvez le spécialiste idéal en quelques secondes
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-neutral-600 sm:text-lg dark:text-neutral-300">
                Parcourez un réseau certifié de médecins et découvrez leurs disponibilités avant même de vous connecter. Le parcours de soin devient simple, rapide et personnalisé.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button size="lg" className="shadow-lg" onClick={scrollToResults}>
                  Explorer les médecins
                  <ArrowRight className="h-4 w-4" />
                </Button>
                {!user && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push(loginUrl)}
                    className="border-primary-500 text-primary-600 hover:bg-primary-50"
                  >
                    Se connecter pour réserver
                  </Button>
                )}
              </div>
            </div>
            <div className="grid gap-4 rounded-2xl bg-white/85 p-6 shadow-xl dark:bg-neutral-900/80">
              <div>
                <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Professionnels vérifiés</p>
                <p className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">120+</p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <div>
                  <p className="text-2xl font-semibold text-primary-600 dark:text-primary-300">98%</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Patients satisfaits</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-primary-600 dark:text-primary-300">24h</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Délai moyen de rendez-vous</p>
                </div>
              </div>
              <div className="rounded-xl bg-primary-50/60 p-4 text-sm text-primary-700 dark:bg-primary-900/20 dark:text-primary-200">
                Accédez aux profils détaillés, aux langues parlées, aux honoraires et réservez en seulement trois étapes.
              </div>
            </div>
          </div>
        </section>

        <Card className="mb-10">
          <CardContent className="py-6">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Nom, spécialité..."
                      value={filters.search ?? ""}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, search: event.target.value }))
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Ville"
                      value={filters.city ?? ""}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, city: event.target.value }))
                      }
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400"
                    />
                  </div>
                </div>

                <Button type="submit">Rechercher</Button>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className="flex items-center text-sm text-primary hover:text-primary-dark font-semibold"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtres avancés
                <ChevronDown
                  className={`h-4 w-4 ml-1 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </button>

              {showFilters && (
                <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                      label="Spécialisation"
                      value={filters.specialization ?? ""}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, specialization: event.target.value }))
                      }
                      options={[
                        { value: "", label: "Toutes" },
                        { value: "Médecin généraliste", label: "Médecin généraliste" },
                        { value: "Cardiologue", label: "Cardiologue" },
                        { value: "Dermatologue", label: "Dermatologue" },
                        { value: "Pédiatre", label: "Pédiatre" },
                        { value: "Gynécologue", label: "Gynécologue" },
                        { value: "Dentiste", label: "Dentiste" },
                      ]}
                    />

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Note minimum
                      </label>
                      <select
                        value={filters.min_rating ?? ""}
                        onChange={(event) =>
                          setFilters((prev) => ({
                            ...prev,
                            min_rating: event.target.value ? Number(event.target.value) : undefined,
                          }))
                        }
                        className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400"
                      >
                        <option value="">Toutes</option>
                        <option value="4.5">4.5+ ⭐</option>
                        <option value="4.0">4.0+ ⭐</option>
                        <option value="3.5">3.5+ ⭐</option>
                        <option value="3.0">3.0+ ⭐</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Tarif maximum (€)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={filters.max_fee ?? ""}
                        onChange={(event) =>
                          setFilters((prev) => ({
                            ...prev,
                            max_fee: event.target.value ? Number(event.target.value) : undefined,
                          }))
                        }
                        className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-400"
                      />
                    </div>

                    <div>
                      <label className="flex items-center mt-8">
                        <input
                          type="checkbox"
                          checked={!!filters.accepting_new_patients}
                          onChange={(event) =>
                            setFilters((prev) => ({
                              ...prev,
                              accepting_new_patients: event.target.checked || undefined,
                            }))
                          }
                          className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
                        />
                        <span className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">
                          Accepte nouveaux patients
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Effacer les filtres
                    </button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <div
          id="doctor-search-results"
          className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-neutral-600 dark:text-neutral-400 sm:text-base">
            {loading
              ? "Analyse des disponibilités en cours..."
              : `${doctors.length} spécialiste(s) correspondent à vos critères`}
          </p>
          {!loading && (
            <div className="flex items-center gap-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary-700 dark:text-primary-300">
                <span className="h-2 w-2 rounded-full bg-primary-500 shadow-[0_0_0_3px_rgba(59,130,246,0.2)]" />
                Disponibilités actualisées en temps réel
              </span>
              <span className="hidden sm:inline text-neutral-400">|</span>
              <span className="text-neutral-500 dark:text-neutral-400">
                Ajustez les filtres pour affiner votre recherche
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : doctors.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {doctors.map((doctor) => (
              <Card key={doctor.id} hover>
                <CardContent className="py-6">
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        {doctor.profile_image ? (
                          <Image
                            src={doctor.profile_image}
                            alt={`Dr. ${doctor.last_name}`}
                            width={80}
                            height={80}
                            className="h-20 w-20 rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-10 w-10 text-primary" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-heading font-bold text-neutral-800 dark:text-neutral-100 mb-1">
                          Dr. {doctor.first_name} {doctor.last_name}
                        </h3>
                        <p className="text-sm text-primary font-semibold mb-2">
                          {doctor.specialization || "Médecin"}
                        </p>

                        {doctor.rating_average && (
                          <div className="flex items-center mb-2">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                            <span className="font-semibold text-neutral-800 dark:text-neutral-100 mr-1">
                              {doctor.rating_average.toFixed(1)}
                            </span>
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                              ({doctor.rating_count} avis)
                            </span>
                          </div>
                        )}

                        <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {doctor.city || "Localisation non spécifiée"}
                        </div>

                        {typeof doctor.consultation_fee === "number" && (
                          <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {doctor.consultation_fee}€ la consultation
                          </div>
                        )}

                        {doctor.bio && (
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                            {doctor.bio}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-3">
                          {doctor.accepting_new_patients && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                              Accepte nouveaux patients
                            </span>
                          )}
                          {doctor.is_verified && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                              ✓ Vérifié
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Button onClick={() => handleBookAppointment(doctor.id)} className="whitespace-nowrap">
                          <Calendar className="h-4 w-4 mr-2" />
                          {canBookAppointment ? "Prendre RDV" : "Se connecter pour réserver"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/doctor-profile/${doctor.id}`)}
                        >
                          Voir le profil
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-16 w-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
                Aucun médecin trouvé
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Essayez de modifier vos critères de recherche
              </p>
              <Button onClick={clearFilters} variant="outline">
                Réinitialiser les filtres
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
