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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-warm-peach/20 to-secondary-50 py-12 px-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-200 to-secondary-200 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-warm-amber/20 to-warm-rose/20 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-6 group">
            <div className="bg-gradient-to-br from-primary-500 via-warm-coral to-warm-sunset p-3 rounded-2xl shadow-warm group-hover:shadow-glow group-hover:scale-110 transition-all duration-300">
              <Heart className="h-9 w-9 text-white drop-shadow-lg" fill="white" />
            </div>
            <span className="text-4xl font-heading font-bold bg-gradient-to-r from-primary-600 via-warm-coral to-warm-sunset bg-clip-text text-transparent">Santé</span>
          </Link>
          <h1 className="text-4xl font-heading font-bold text-neutral-800 mb-3 tracking-tight">
            Créer un compte
          </h1>
          <p className="text-neutral-600 text-lg">
            Rejoignez notre plateforme de santé moderne
          </p>
        </div>

        {/* Role Selection */}
        <Card className="mb-6 shadow-warm backdrop-blur-sm bg-white/95 border border-primary-100/50">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-neutral-800 text-center">Sélectionnez votre profil</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole(UserRole.PATIENT)}
              className={`relative py-6 px-6 rounded-xl border-2 transition-all duration-300 overflow-hidden group ${
                role === UserRole.PATIENT
                  ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 shadow-warm'
                  : 'border-neutral-200 hover:border-primary-300 hover:shadow-soft'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-primary-400/0 to-primary-400/10 transition-opacity ${
                role === UserRole.PATIENT ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
              }`}></div>
              <div className="relative z-10">
                <div className="text-3xl mb-2">🏥</div>
                <p className={`font-bold text-lg mb-1 transition-colors ${
                  role === UserRole.PATIENT ? 'text-primary-700' : 'text-neutral-800 group-hover:text-primary-600'
                }`}>Patient</p>
                <p className="text-sm text-neutral-600">Je cherche un médecin</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole(UserRole.DOCTOR)}
              className={`relative py-6 px-6 rounded-xl border-2 transition-all duration-300 overflow-hidden group ${
                role === UserRole.DOCTOR
                  ? 'border-secondary-500 bg-gradient-to-br from-secondary-50 to-secondary-100 shadow-warm'
                  : 'border-neutral-200 hover:border-secondary-300 hover:shadow-soft'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-secondary-400/0 to-secondary-400/10 transition-opacity ${
                role === UserRole.DOCTOR ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
              }`}></div>
              <div className="relative z-10">
                <div className="text-3xl mb-2">👨‍⚕️</div>
                <p className={`font-bold text-lg mb-1 transition-colors ${
                  role === UserRole.DOCTOR ? 'text-secondary-700' : 'text-neutral-800 group-hover:text-secondary-600'
                }`}>Praticien</p>
                <p className="text-sm text-neutral-600">Je suis médecin</p>
              </div>
            </button>
          </div>
        </Card>

        {/* Registration Form */}
        <Card className="shadow-warm backdrop-blur-sm bg-white/95 border border-primary-100/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-accent-error rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                <AlertCircle className="h-5 w-5 text-accent-error mt-0.5 animate-pulse" />
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            )}

            {/* Personal Information */}
            <div>
              <h3 className="text-xl font-bold text-neutral-800 mb-5 flex items-center">
                <span className="bg-gradient-to-r from-primary-500 to-warm-sunset text-white w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">1</span>
                Informations personnelles
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-800 mb-2">
                    Prénom <span className="text-accent-error">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-primary-400 group-focus-within:text-primary-600 transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 hover:border-primary-300 transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-800 mb-2">
                    Nom <span className="text-accent-error">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-primary-400 group-focus-within:text-primary-600 transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 hover:border-primary-300 transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-xl font-bold text-neutral-800 mb-5 flex items-center">
                <span className="bg-gradient-to-r from-primary-500 to-warm-sunset text-white w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">2</span>
                Coordonnées
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-800 mb-2">
                    Adresse e-mail <span className="text-accent-error">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-primary-400 group-focus-within:text-primary-600 transition-colors" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 hover:border-primary-300 transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-800 mb-2">
                    Téléphone
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-primary-400 group-focus-within:text-primary-600 transition-colors" />
                    </div>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 hover:border-primary-300 transition-all shadow-sm"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-neutral-800 mb-2">
                  Date de naissance
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-primary-400 group-focus-within:text-primary-600 transition-colors" />
                  </div>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 hover:border-primary-300 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-800 mb-2">
                  Genre
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 hover:border-primary-300 transition-all shadow-sm"
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
              <div className="bg-gradient-to-br from-secondary-50 to-white p-6 rounded-2xl border-2 border-secondary-200">
                <h3 className="text-xl font-bold text-neutral-800 mb-5 flex items-center">
                  <span className="bg-gradient-to-r from-secondary-500 to-warm-amber text-white w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">👨‍⚕️</span>
                  Informations professionnelles
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-neutral-800 mb-2">
                      Spécialisation <span className="text-accent-error">*</span>
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:border-secondary-400 hover:border-secondary-300 transition-all shadow-sm"
                      placeholder="Ex: Médecin généraliste, Cardiologue..."
                      required={role === UserRole.DOCTOR}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-neutral-800 mb-2">
                      Numéro de licence <span className="text-accent-error">*</span>
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:border-secondary-400 hover:border-secondary-300 transition-all shadow-sm"
                      placeholder="Numéro RPPS"
                      required={role === UserRole.DOCTOR}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <h3 className="text-xl font-bold text-neutral-800 mb-5 flex items-center">
                <span className="bg-gradient-to-r from-primary-500 to-warm-sunset text-white w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">3</span>
                Sécurité
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-800 mb-2">
                    Mot de passe <span className="text-accent-error">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-primary-400 group-focus-within:text-primary-600 transition-colors" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 hover:border-primary-300 transition-all shadow-sm"
                      minLength={8}
                      required
                    />
                  </div>
                  <p className="text-xs text-neutral-600 mt-2 flex items-center">
                    <span className="mr-2">ℹ️</span> Minimum 8 caractères
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral-800 mb-2">
                    Confirmer le mot de passe <span className="text-accent-error">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-primary-400 group-focus-within:text-primary-600 transition-colors" />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 hover:border-primary-300 transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mt-8 p-4 bg-gradient-to-br from-neutral-50 to-primary-50/20 rounded-xl border border-neutral-200">
              <label className="flex items-start cursor-pointer group">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="h-5 w-5 text-primary-600 focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 border-neutral-300 rounded mt-0.5 cursor-pointer transition-all"
                  required
                />
                <span className="ml-3 text-sm text-neutral-700 leading-relaxed">
                  J&apos;accepte les{' '}
                  <Link href="/terms" className="text-primary-600 hover:text-primary-700 font-bold hover:underline">
                    conditions d&apos;utilisation
                  </Link>
                  {' '}et la{' '}
                  <Link href="/privacy" className="text-primary-600 hover:text-primary-700 font-bold hover:underline">
                    politique de confidentialité
                  </Link>
                </span>
              </label>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              className="mt-8 !bg-gradient-to-r from-primary-500 to-warm-sunset hover:from-primary-600 hover:to-warm-sunset/90 shadow-warm hover:shadow-glow transition-all duration-300 text-lg py-4"
            >
              Créer mon compte
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-neutral-600 text-base">
              Vous avez déjà un compte?{' '}
              <Link
                href="/login"
                className="text-primary-600 hover:text-primary-700 font-bold hover:underline transition-all"
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
