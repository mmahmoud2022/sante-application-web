/**
 * Login Page
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password, remember_me: rememberMe });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6 group">
            <div className="bg-gradient-to-br from-primary-500 to-secondary-500 p-2.5 rounded-xl shadow-medical group-hover:scale-110 transition-transform">
              <Heart className="h-8 w-8 text-white" fill="white" />
            </div>
            <span className="text-3xl font-heading font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Santé</span>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-neutral-800 mb-2">
            Connexion
          </h1>
          <p className="text-neutral-600">
            Accédez à votre espace personnel
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-large">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-primary-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-primary-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded transition-all"
                />
                <span className="ml-2 text-sm text-neutral-700 group-hover:text-neutral-900">
                  Se souvenir de moi
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                Mot de passe oublié?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              className="mt-6"
            >
              Se connecter
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-neutral-600">
              Pas encore de compte?{' '}
              <Link
                href="/register"
                className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                S&apos;inscrire
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-neutral-100">
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/register?role=patient"
                className="text-center py-4 px-4 border-2 border-neutral-100 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all group"
              >
                <div className="text-2xl mb-1">🏥</div>
                <p className="font-semibold text-neutral-800 group-hover:text-primary-600">Patient</p>
                <p className="text-xs text-neutral-600 mt-1">Prendre RDV</p>
              </Link>
              <Link
                href="/register?role=doctor"
                className="text-center py-4 px-4 border-2 border-neutral-100 rounded-xl hover:border-secondary-500 hover:bg-secondary-50 transition-all group"
              >
                <div className="text-2xl mb-1">👨‍⚕️</div>
                <p className="font-semibold text-neutral-800 group-hover:text-secondary-600">Praticien</p>
                <p className="text-xs text-neutral-600 mt-1">Gérer mon agenda</p>
              </Link>
            </div>
          </div>
        </Card>

        <p className="text-center text-sm text-neutral-500 mt-6">
          En vous connectant, vous acceptez nos{' '}
          <Link href="/terms" className="text-primary-600 hover:underline">
            Conditions d&apos;utilisation
          </Link>
          {' '}et notre{' '}
          <Link href="/privacy" className="text-primary-600 hover:underline">
            Politique de confidentialité
          </Link>
        </p>
      </div>
    </div>
  );
}
