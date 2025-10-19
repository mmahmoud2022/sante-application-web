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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <Heart className="h-10 w-10 text-primary" />
            <span className="text-3xl font-heading font-bold text-primary">Santé</span>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-neutral-800 mb-2">
            Connexion
          </h1>
          <p className="text-neutral-600">
            Accédez à votre espace personnel
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
                />
                <span className="ml-2 text-sm text-neutral-700">
                  Se souvenir de moi
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:text-primary-dark font-medium"
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
                className="text-primary hover:text-primary-dark font-semibold"
              >
                S&apos;inscrire
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-neutral-200">
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/register?role=patient"
                className="text-center py-3 px-4 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <p className="font-semibold text-neutral-800">Patient</p>
                <p className="text-xs text-neutral-600 mt-1">Prendre RDV</p>
              </Link>
              <Link
                href="/register?role=doctor"
                className="text-center py-3 px-4 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <p className="font-semibold text-neutral-800">Praticien</p>
                <p className="text-xs text-neutral-600 mt-1">Gérer mon agenda</p>
              </Link>
            </div>
          </div>
        </Card>

        <p className="text-center text-sm text-neutral-500 mt-6">
          En vous connectant, vous acceptez nos{' '}
          <Link href="/terms" className="text-primary hover:underline">
            Conditions d&apos;utilisation
          </Link>
          {' '}et notre{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Politique de confidentialité
          </Link>
        </p>
      </div>
    </div>
  );
}
