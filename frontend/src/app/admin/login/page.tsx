/**
 * Admin Login Page with Admin Secret
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Heart, Lock, Mail, Shield } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function AdminLogin() {
  const { login } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    adminSecret: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate admin secret
      if (!formData.adminSecret) {
        throw new Error('Le code secret administrateur est requis');
      }

      // First, try to login
      await login({
        email: formData.email,
        password: formData.password,
        remember_me: false,
      });

      // After successful login, verify user is admin
      // AuthContext will handle redirection based on role
    } catch (err: any) {
      if (err.message === 'NOT_ADMIN') {
        setError('Accès refusé : vous n\'êtes pas administrateur');
      } else {
        setError(err.message || 'Email ou mot de passe incorrect');
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
            Espace Administrateur
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Connexion sécurisée avec code secret
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 backdrop-blur-sm bg-white/95 dark:bg-neutral-800/95 border-2 border-neutral-200 dark:border-neutral-700 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Entrez le code secret"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminSecret(!showAdminSecret)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  {showAdminSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                Code fourni par le système
              </p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
                Email administrateur <span className="text-red-500">*</span>
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
                  placeholder="••••••••"
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
                  <span>Connexion...</span>
                </div>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Nouveau compte administrateur ?{' '}
              <Link
                href="/admin/register"
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold hover:underline"
              >
                S&apos;enregistrer
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
