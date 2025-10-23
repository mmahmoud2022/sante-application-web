/**
 * User Profile Settings Page
 * Allows patients to view and update their profile information
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Bell,
  Lock,
  Save,
  Edit2,
  CheckCircle,
  AlertCircle,
  Heart,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import api from '@/lib/api';
import logger from '@/lib/logger';

export default function ProfilePage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    insurance_provider: '',
    insurance_number: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

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
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || '',
        address: user.address || '',
        city: user.city || '',
        postal_code: user.postal_code || '',
        country: user.country || '',
        insurance_provider: user.insurance_provider || '',
        insurance_number: user.insurance_number || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
      });
    }
  }, [user, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      await updateUser(formData as any);
      
  setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
      setEditing(false);
    } catch (error: any) {
      logger.error('Failed to update profile', {
        userId: user?.id,
        errorMessage: error.message,
      }, error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Échec de la mise à jour du profil. Veuillez réessayer.' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original user data
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || '',
        address: user.address || '',
        city: user.city || '',
        postal_code: user.postal_code || '',
        country: user.country || '',
        insurance_provider: user.insurance_provider || '',
        insurance_number: user.insurance_number || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
      });
    }
    setEditing(false);
    setMessage(null);
  };

  if (authLoading) {
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
              <h1 className="text-2xl font-bold text-gray-900">Paramètres du profil</h1>
              <p className="text-gray-600 mt-1">Gérez vos informations personnelles et vos préférences</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/patient/dashboard')}
                disabled={saving}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour au tableau de bord
              </Button>
              {!editing ? (
                <Button onClick={() => setEditing(true)}>
                  <Edit2 className="w-5 h-5 mr-2" />
                  Modifier le profil
                </Button>
              ) : (
                <div className="flex gap-2 sm:gap-3">
                  <Button variant="outline" onClick={handleCancel} disabled={saving}>
                    Annuler
                  </Button>
                  <Button onClick={handleSave} loading={saving} disabled={saving}>
                    <Save className="w-5 h-5 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="text-center py-8">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {user?.first_name} {user?.last_name}
                </h3>
                <p className="text-gray-600 mt-1">{user?.email}</p>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Membre depuis {new Date(user?.created_at || '').toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Shield className="w-5 h-5 mr-2 text-green-500" />
                  Statut du compte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">E-mail vérifié</span>
                    {user?.is_verified ? (
                      <span className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Vérifié
                      </span>
                    ) : (
                      <span className="flex items-center text-orange-600 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Non vérifié
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Compte actif</span>
                    {user?.is_active ? (
                      <span className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Actif
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Inactif
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Double authentification</span>
                    {user?.two_factor_enabled ? (
                      <span className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Activée
                      </span>
                    ) : (
                      <span className="flex items-center text-gray-600 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Désactivée
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <Input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <Input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail *
                    </label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={true} // Email should not be editable
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de téléphone
                    </label>
                    <Input
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de naissance
                    </label>
                    <Input
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Genre
                    </label>
                    <Select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      disabled={!editing}
                    >
                      <option value="">Sélectionner</option>
                      <option value="male">Homme</option>
                      <option value="female">Femme</option>
                      <option value="other">Autre</option>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Coordonnées postales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="123 Rue de la Paix"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ville
                      </label>
                      <Input
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="Paris"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code postal
                      </label>
                      <Input
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="75001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pays
                      </label>
                      <Input
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="France"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insurance Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Informations d'assurance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assureur
                    </label>
                    <Input
                      name="insurance_provider"
                      value={formData.insurance_provider}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="Sécurité Sociale"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro d'assurance
                    </label>
                    <Input
                      name="insurance_number"
                      value={formData.insurance_number}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="1 23 45 67 890 123"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-red-500" />
                  Contact d'urgence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du contact
                    </label>
                    <Input
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone du contact
                    </label>
                    <Input
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="+33 6 98 76 54 32"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Mot de passe</p>
                      <p className="text-sm text-gray-600">Modifiez votre mot de passe</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Modifier
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Authentification à deux facteurs</p>
                      <p className="text-sm text-gray-600">
                        {user?.two_factor_enabled ? 'Désactiver la 2FA' : 'Ajoutez une couche de sécurité supplémentaire'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      {user?.two_factor_enabled ? 'Désactiver' : 'Activer'} la 2FA
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Préférences de notification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Notifications e-mail</p>
                      <p className="text-sm text-gray-600">Recevez des e-mails concernant vos rendez-vous et vos mises à jour</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-primary border-gray-300 rounded" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Notifications SMS</p>
                      <p className="text-sm text-gray-600">Recevez des SMS de rappel pour vos rendez-vous</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-primary border-gray-300 rounded" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Notifications push</p>
                      <p className="text-sm text-gray-600">Recevez des notifications push dans l'application</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-primary border-gray-300 rounded" />
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
