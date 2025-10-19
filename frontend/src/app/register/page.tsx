/**
 * Registration Page
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Heart, Mail, Lock, User, Phone, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UserRole } from '@/types';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const { register } = useAuth();
  
  const [role, setRole] = useState<UserRole>(
    (searchParams.get('role') as UserRole) || UserRole.PATIENT
  );
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    specialization: '',
    licenseNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!acceptTerms) {
      setError('Vous devez accepter les conditions d\'utilisation');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: role,
        phone_number: formData.phoneNumber || undefined,
        date_of_birth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        specialization: role === UserRole.DOCTOR ? formData.specialization : undefined,
        license_number: role === UserRole.DOCTOR ? formData.licenseNumber : undefined,
      });
    } catch (err: any) {
      setError(err.message || 'L\'inscription a échoué. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <Heart className="h-10 w-10 text-primary" />
            <span className="text-3xl font-heading font-bold text-primary">Santé</span>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-neutral-800 mb-2">
            Créer un compte
          </h1>
          <p className="text-neutral-600">
            Rejoignez notre communauté santé
          </p>
        </div>

        {/* Role Selection */}
        <Card className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole(UserRole.PATIENT)}
              className={`py-4 px-6 rounded-lg border-2 transition-all ${
                role === UserRole.PATIENT
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <p className="font-semibold text-lg">Patient</p>
              <p className="text-sm mt-1 opacity-80">Je cherche un médecin</p>
            </button>
            <button
              type="button"
              onClick={() => setRole(UserRole.DOCTOR)}
              className={`py-4 px-6 rounded-lg border-2 transition-all ${
                role === UserRole.DOCTOR
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <p className="font-semibold text-lg">Praticien</p>
              <p className="text-sm mt-1 opacity-80">Je suis médecin</p>
            </button>
          </div>
        </Card>

        {/* Registration Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                Informations personnelles
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Prénom <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Nom <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-4 mt-6">
                Coordonnées
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Téléphone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Date de naissance
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Genre
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Sélectionner</option>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>

            {/* Doctor Specific Fields */}
            {role === UserRole.DOCTOR && (
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-4 mt-6">
                  Informations professionnelles
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Spécialisation <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ex: Médecin généraliste, Cardiologue..."
                      required={role === UserRole.DOCTOR}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Numéro de licence <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Numéro RPPS"
                      required={role === UserRole.DOCTOR}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-4 mt-6">
                Mot de passe
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Mot de passe <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      minLength={8}
                      required
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Minimum 8 caractères
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Confirmer le mot de passe <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-neutral-400" />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mt-6">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded mt-1"
                  required
                />
                <span className="ml-2 text-sm text-neutral-700">
                  J&apos;accepte les{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    conditions d&apos;utilisation
                  </Link>
                  {' '}et la{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    politique de confidentialité
                  </Link>
                </span>
              </label>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              className="mt-6"
            >
              Créer mon compte
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-600">
              Vous avez déjà un compte?{' '}
              <Link
                href="/login"
                className="text-primary hover:text-primary-dark font-semibold"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
