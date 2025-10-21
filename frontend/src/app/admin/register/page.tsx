/**
 * Admin Registration Page with Admin Secret
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Heart, Lock, Mail, Shield, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';

export default function AdminRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    adminSecret: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    // Validate admin secret
    if (!formData.adminSecret) {
      setError('Le code secret administrateur est requis');
      setLoading(false);
      return;
    }

    try {
      // Register with admin secret
      await api.auth.register({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: 'admin',
        admin_secret: formData.adminSecret,
      });

      // Redirect to admin login
      router.push('/admin/login?registered=true');
    } catch (err: any) {
      if (err.response?.data?.detail === 'INVALID_ADMIN_SECRET') {
        setError('Code secret administrateur invalide');
      } else if (err.response?.data?.detail?.includes('Email already registered')) {
        setError('Cet email est déjà enregistré');
      } else {
        setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-neutral-900 dark:via-red-950 dark:to-orange-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-red-500 to-orange-500 p-3 rounded-2xl shadow-2xl">
              <Shield className="h-10 w-10 text-white" fill="white" />
            </div>
          </div>
          <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
            Nouveau Compte Admin
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Enregistrement sécurisé avec code secret
          </p>
        </div>

        {/* Register Card */}
        <Card className="p-8 backdrop-blur-sm bg-white/95 dark:bg-neutral-800/95 border-2 border-neutral-200 dark:border-neutral-700 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl flex items-start gap-3">
                <Lock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Admin Secret */}
            <div>
              <label htmlFor="adminSecret" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                Code Secret Administrateur <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-red-400" />
                </div>
                <input
                  id="adminSecret"
                  name="adminSecret"
                  type={showAdminSecret ? 'text' : 'password'}
                  required
                  value={formData.adminSecret}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
                  placeholder="Code fourni par le système"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminSecret(!showAdminSecret)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  {showAdminSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
                    placeholder="Jean"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
                  placeholder="Dupont"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
                  placeholder="admin@sante.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
                  placeholder="Minimum 8 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
                  placeholder="Confirmez votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              disabled={loading}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3.5 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Création du compte...</span>
                </div>
              ) : (
                'Créer le compte administrateur'
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Déjà un compte ?{' '}
              <Link
                href="/admin/login"
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </Card>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center justify-center gap-2 group"
          >
            <Heart className="h-4 w-4 group-hover:text-red-500 transition-colors" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
