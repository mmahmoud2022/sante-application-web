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
  const { user, loading: authLoading, updateUser, syncUser } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);
  
  // 2FA modal
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(false);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
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
      const userData = user as any;
      
      // Format date_of_birth to YYYY-MM-DD for input type="date"
      let formattedDate = '';
      if (user.date_of_birth) {
        try {
          const date = new Date(user.date_of_birth);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Error formatting date:', e);
        }
      }
      
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: userData.phone || '',
        date_of_birth: formattedDate,
        address_line1: userData.address_line1 || '',
        address_line2: userData.address_line2 || '',
        city: userData.city || '',
        state: userData.state || '',
        postal_code: userData.postal_code || '',
        country: userData.country || '',
      });
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    setIs2FAEnabled(Boolean(user?.mfa_enabled));
  }, [user]);

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
      const userData = user as any;
      
      // Format date_of_birth to YYYY-MM-DD for input type="date"
      let formattedDate = '';
      if (user.date_of_birth) {
        try {
          const date = new Date(user.date_of_birth);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Error formatting date:', e);
        }
      }
      
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: userData.phone || '',
        date_of_birth: formattedDate,
        address_line1: userData.address_line1 || '',
        address_line2: userData.address_line2 || '',
        city: userData.city || '',
        state: userData.state || '',
        postal_code: userData.postal_code || '',
        country: userData.country || '',
      });
    }
    setEditing(false);
    setMessage(null);
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

      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès !' });
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
      setMessage({ 
        type: 'error', 
        text: error?.response?.data?.detail || 'Échec de la modification du mot de passe. Veuillez réessayer.' 
      });
      setPasswordModalError(error?.response?.data?.detail || 'Échec de la modification du mot de passe. Veuillez réessayer.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      setToggling2FA(true);
      setMessage(null);

      if (is2FAEnabled) {
        // Disable 2FA
        await api.auth.disable2FA();
        setMessage({ type: 'success', text: 'Authentification à deux facteurs désactivée.' });
        setIs2FAEnabled(false);
        syncUser({ mfa_enabled: false });
      } else {
        // Enable 2FA
        await api.auth.enable2FA();
        setMessage({ type: 'success', text: 'Authentification à deux facteurs activée avec succès !' });
        setIs2FAEnabled(true);
        syncUser({ mfa_enabled: true });
      }

      setShow2FAModal(false);
    } catch (error: any) {
      logger.error('Failed to toggle 2FA', {
        userId: user?.id,
        errorMessage: error?.response?.data?.detail || error.message,
      }, error);
      setMessage({ 
        type: 'error', 
        text: error?.response?.data?.detail || 'Échec de la modification de la 2FA. Veuillez réessayer.' 
      });
    } finally {
      setToggling2FA(false);
    }
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
                    {is2FAEnabled ? (
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
                      name="phone"
                      value={formData.phone}
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
                      Adresse ligne 1
                    </label>
                    <Input
                      name="address_line1"
                      value={formData.address_line1}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="123 Rue de la Paix"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse ligne 2 (optionnel)
                    </label>
                    <Input
                      name="address_line2"
                      value={formData.address_line2}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="Appartement 5B"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        Région/État
                      </label>
                      <Input
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="Île-de-France"
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        console.log('Password change button clicked');
                        setShowPasswordModal(true);
                        setPasswordModalError(null);
                      }}
                    >
                      Modifier
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Authentification à deux facteurs</p>
                      <p className="text-sm text-gray-600">
                        {is2FAEnabled ? 'Désactiver la 2FA' : 'Ajoutez une couche de sécurité supplémentaire'}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        console.log('2FA toggle button clicked');
                        setShow2FAModal(true);
                      }}
                    >
                      {is2FAEnabled ? 'Désactiver' : 'Activer'} la 2FA
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
      
      {/* Password Change Modal */}
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
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
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
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
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
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
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

      {/* 2FA Toggle Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" style={{ pointerEvents: 'auto' }}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {is2FAEnabled ? 'Désactiver' : 'Activer'} l'authentification à deux facteurs
            </h3>
            <p className="text-gray-600 mb-6">
              {is2FAEnabled
                ? 'Êtes-vous sûr de vouloir désactiver l\'authentification à deux facteurs ? Cela réduira la sécurité de votre compte.'
                : 'L\'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte. Vous devrez entrer un code de sécurité lors de chaque connexion.'}
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShow2FAModal(false)}
                disabled={toggling2FA}
              >
                Annuler
              </Button>
              <Button
                onClick={handleToggle2FA}
                disabled={toggling2FA}
                variant={is2FAEnabled ? 'danger' : 'primary'}
              >
                {toggling2FA ? 'Traitement...' : (is2FAEnabled ? 'Désactiver' : 'Activer')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
