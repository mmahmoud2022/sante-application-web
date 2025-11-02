/**
 * Doctor Profile Management Page
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Phone,
  BadgeCheck,
  Stethoscope,
  GraduationCap,
  Building2,
  MapPin,
  Globe,
  FileText,
  Save,
  Edit2,
  XCircle,
  CheckCircle,
  ChevronLeft,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import api from '@/lib/api';
import logger from '@/lib/logger';

interface FormState {
  first_name: string;
  last_name: string;
  phone: string;
  specialization: string;
  bio: string;
  experience_years: string;
  consultation_fee: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  languages_spoken: string;
}

const DEFAULT_FORM: FormState = {
  first_name: '',
  last_name: '',
  phone: '',
  specialization: '',
  bio: '',
  experience_years: '',
  consultation_fee: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  languages_spoken: '',
};

export default function DoctorProfilePage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<FormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);

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
      const enrichedUser = user as unknown as Record<string, any>;
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: (enrichedUser.phone as string) || user.phone || '',
        specialization: enrichedUser.specialization || '',
        bio: enrichedUser.bio || '',
        experience_years: enrichedUser.experience_years ? String(enrichedUser.experience_years) : '',
        consultation_fee: enrichedUser.consultation_fee ? String(enrichedUser.consultation_fee) : '',
        address_line1: enrichedUser.address_line1 || '',
        address_line2: enrichedUser.address_line2 || '',
        city: enrichedUser.city || '',
        state: enrichedUser.state || '',
        postal_code: enrichedUser.postal_code || '',
        country: enrichedUser.country || '',
        languages_spoken: enrichedUser.languages_spoken || '',
      });
      setLoading(false);
    }
  }, [user, authLoading, router]);

  const doctorProfile = useMemo(() => user as unknown as Record<string, any> | null, [user]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    if (user) {
      const enrichedUser = user as unknown as Record<string, any>;
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: (enrichedUser.phone as string) || user.phone || '',
        specialization: enrichedUser.specialization || '',
        bio: enrichedUser.bio || '',
        experience_years: enrichedUser.experience_years ? String(enrichedUser.experience_years) : '',
        consultation_fee: enrichedUser.consultation_fee ? String(enrichedUser.consultation_fee) : '',
        address_line1: enrichedUser.address_line1 || '',
        address_line2: enrichedUser.address_line2 || '',
        city: enrichedUser.city || '',
        state: enrichedUser.state || '',
        postal_code: enrichedUser.postal_code || '',
        country: enrichedUser.country || '',
        languages_spoken: enrichedUser.languages_spoken || '',
      });
    }
    setEditing(false);
    setMessage(null);
  };

  const handleSave = async () => {
    const payload: Record<string, any> = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      phone: formData.phone.trim() || null,
      specialization: formData.specialization.trim() || null,
      bio: formData.bio.trim() || null,
      experience_years: formData.experience_years ? Number(formData.experience_years) : null,
      consultation_fee: formData.consultation_fee ? Number(formData.consultation_fee) : null,
      address_line1: formData.address_line1.trim() || null,
      address_line2: formData.address_line2.trim() || null,
      city: formData.city.trim() || null,
      state: formData.state.trim() || null,
      postal_code: formData.postal_code.trim() || null,
      country: formData.country.trim() || null,
      languages_spoken: formData.languages_spoken.trim() || null,
    };

    setSaving(true);
    setMessage(null);
    try {
      await updateUser(payload as any);
      setEditing(false);
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
    } catch (error: any) {
      logger.error('Failed to update doctor profile', {
        userId: user?.id,
        errorMessage: error?.message,
      }, error);
      setMessage({
        type: 'error',
        text: error?.message || 'La mise à jour du profil a échoué. Veuillez réessayer.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordModalError(null);

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      setPasswordModalError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (passwordData.new_password.length < 12) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 12 caractères.' });
      setPasswordModalError('Le mot de passe doit contenir au moins 12 caractères.');
      return;
    }

    try {
      setChangingPassword(true);
      setMessage(null);

      await api.auth.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });

      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès.' });
      setShowPasswordModal(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setPasswordModalError(null);
    } catch (error: any) {
      logger.error('Failed to change password', {
        userId: user?.id,
        errorMessage: error?.response?.data?.detail || error.message,
      }, error);
      const detail = error?.response?.data?.detail || 'Échec de la modification du mot de passe. Veuillez réessayer.';
      setMessage({ type: 'error', text: detail });
      setPasswordModalError(detail);
    } finally {
      setChangingPassword(false);
    }
  };

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-neutral-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
      <header className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 shadow-medical">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-semibold text-neutral-900 dark:text-neutral-100">
                Mon profil médical
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-300">
                Gérez vos informations professionnelles et personnelles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/doctor/dashboard')}
              className="hidden sm:inline-flex"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Tableau de bord
            </Button>
            {!editing ? (
              <Button onClick={() => setEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            ) : (
              <div className="flex space-x-3">
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleSave} loading={saving} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {message && (
          <div
            className={`rounded-lg px-4 py-3 flex items-center gap-2 shadow-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card className="border-2 border-neutral-100">
              <CardContent className="py-8 text-center space-y-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                  <UserIcon className="h-12 w-12 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Dr. {user.first_name} {user.last_name}
                  </h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {doctorProfile?.specialization || 'Spécialité non renseignée'}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" /> {user.email}
                  </div>
                  {(doctorProfile?.phone || user.phone) && (
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4" /> {doctorProfile?.phone || user.phone}
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <BadgeCheck className={`h-4 w-4 ${user.is_verified ? 'text-green-500' : 'text-amber-500'}`} />
                    {user.is_verified ? 'Compte vérifié' : 'Vérification en attente'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-neutral-100">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-secondary-600" />
                  Statistiques professionnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
                <div className="flex items-center justify-between">
                  <span>Années d'expérience</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                    {doctorProfile?.experience_years ?? '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Honoraires de consultation</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                    {doctorProfile?.consultation_fee
                      ? `${doctorProfile.consultation_fee} €`
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Évaluation moyenne</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                    {doctorProfile?.rating_average ? doctorProfile.rating_average.toFixed(1) : '—'} ({
                      doctorProfile?.rating_count || 0
                    })
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Accepte de nouveaux patients</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                    {doctorProfile?.accepting_new_patients ? 'Oui' : 'Non'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 border-neutral-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-600" />
                  Informations professionnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-600 mb-2 block">Prénom *</label>
                    <Input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600 mb-2 block">Nom *</label>
                    <Input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600 mb-2 block">Numéro de téléphone</label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600 mb-2 block">Spécialité</label>
                    <Input
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="Ex: Cardiologie"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600 mb-2 block">Années d'expérience</label>
                    <Input
                      name="experience_years"
                      type="number"
                      min={0}
                      value={formData.experience_years}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600 mb-2 block">Honoraires (€)</label>
                    <Input
                      name="consultation_fee"
                      type="number"
                      min={0}
                      value={formData.consultation_fee}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-2 block">Langues parlées</label>
                  <Input
                    name="languages_spoken"
                    value={formData.languages_spoken}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="Français, Anglais"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-2 block flex items-center gap-2">
                    <FileText className="h-4 w-4 text-neutral-400" />
                    Biographie
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!editing}
                    className="w-full min-h-[120px] rounded-lg border border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary/20 px-3 py-2 text-sm"
                    placeholder="Présentez votre parcours et votre approche médicale."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-neutral-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary-600" />
                  Sécurité du compte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Mot de passe</p>
                    <p className="text-sm text-neutral-600">Modifiez votre mot de passe pour sécuriser votre compte</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowPasswordModal(true);
                      setPasswordModalError(null);
                    }}
                  >
                    Modifier
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-neutral-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary-600" />
                  Coordonnées du cabinet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-2 block">Adresse</label>
                  <Input
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="123 Rue de la Paix"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-2 block">Complément d'adresse</label>
                  <Input
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleInputChange}
                    disabled={!editing}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-600 mb-2 block flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-neutral-400" /> Ville
                    </label>
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600 mb-2 block">Code postal</label>
                    <Input
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-neutral-600 mb-2 block flex items-center gap-1">
                      <Globe className="h-4 w-4 text-neutral-400" /> Pays
                    </label>
                    <Select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      disabled={!editing}
                    >
                      <option value="">Sélectionner un pays</option>
                      <option value="France">France</option>
                      <option value="Belgique">Belgique</option>
                      <option value="Suisse">Suisse</option>
                      <option value="Luxembourg">Luxembourg</option>
                      <option value="Canada">Canada</option>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 mb-2 block">Région / État</label>
                  <Input
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    disabled={!editing}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-neutral-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary-600" />
                  Informations complémentaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
                <p>
                  Utilisez cette section pour vous assurer que vos informations sont à jour et visibles par vos
                  patients.
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Vos coordonnées sont affichées sur votre profil patient</li>
                  <li>Indiquez votre biographie pour inspirer confiance</li>
                  <li>Ajoutez les langues parlées pour faciliter la prise de rendez-vous</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ pointerEvents: 'auto' }}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Modifier le mot de passe</h3>
            <div className="space-y-4">
              <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-3">
                <p className="font-medium text-gray-700">
                  Le nouveau mot de passe doit respecter les exigences suivantes :
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Longueur minimale de 12 caractères</li>
                  <li>Au moins une lettre majuscule et une lettre minuscule</li>
                  <li>Au moins un chiffre</li>
                  <li>Au moins un caractère spécial parmi !@#$%^&amp;*(),.?&quot;:{}|&lt;&gt;</li>
                </ul>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe actuel
                </label>
                <Input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(event) => setPasswordData({ ...passwordData, current_password: event.target.value })}
                  placeholder="Entrez votre mot de passe actuel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <Input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(event) => setPasswordData({ ...passwordData, new_password: event.target.value })}
                  placeholder="Entrez votre nouveau mot de passe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le nouveau mot de passe
                </label>
                <Input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(event) => setPasswordData({ ...passwordData, confirm_password: event.target.value })}
                  placeholder="Confirmez votre nouveau mot de passe"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                  setPasswordModalError(null);
                }}
                disabled={changingPassword}
              >
                Annuler
              </Button>
              <Button
                onClick={handlePasswordChange}
                disabled={changingPassword}
              >
                {changingPassword ? 'Modification...' : 'Modifier'}
              </Button>
            </div>
            {passwordModalError && (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {passwordModalError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
