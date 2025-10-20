/**
 * Login Page – Modern UI (2025)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerificationPending(false);
    setLoading(true);
    try {
      await login({ email, password, remember_me: rememberMe });
    } catch (err: any) {
      if (err.message === 'VERIFICATION_PENDING') {
        setVerificationPending(true);
        setError('');
      } else {
        setError(err.message || 'Connexion échouée. Vérifiez vos identifiants.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-primary-50 via-white to-secondary-50 relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-0 right-0 w-[28rem] h-[28rem] bg-gradient-to-br from-primary-300 to-secondary-200 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[22rem] h-[22rem] bg-gradient-to-tr from-warm-amber/30 to-warm-coral/20 rounded-full blur-3xl opacity-40 translate-y-1/3 -translate-x-1/4"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center space-x-3 mb-8 group">
            <div className="bg-gradient-to-br from-primary-500 via-warm-coral to-warm-sunset p-3.5 rounded-2xl shadow-warm group-hover:shadow-glow group-hover:scale-110 transition-all duration-300">
              <Heart className="h-9 w-9 text-white drop-shadow" fill="white" />
            </div>
            <span className="text-4xl font-heading font-bold bg-gradient-to-r from-primary-600 via-warm-coral to-warm-sunset bg-clip-text text-transparent">
              Santé
            </span>
          </Link>

          <h1 className="text-4xl font-heading font-bold text-neutral-900 mb-2">
            Bienvenue 👋
          </h1>
          <p className="text-neutral-600 text-base font-medium">
            Connectez-vous à votre espace santé sécurisé
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 shadow-large bg-white/95 backdrop-blur-sm border border-primary-100/60 rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-start gap-3 p-4 border-l-4 border-accent-error bg-red-50/80 rounded-xl shadow-sm">
                <AlertCircle className="h-5 w-5 text-accent-error mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {verificationPending && (
              <div className="flex items-start gap-3 p-4 border-l-4 border-yellow-500 bg-yellow-50/80 rounded-xl shadow-sm">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-yellow-800 font-semibold mb-1">Compte en attente de vérification</p>
                  <p className="text-sm text-yellow-700">
                    Votre compte médecin est en cours de vérification par notre équipe. 
                    Vous recevrez un email dès que votre compte sera approuvé. 
                    Merci de votre patience.
                  </p>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-2">
                Adresse e-mail
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 hover:border-primary-300 transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-2">
                Mot de passe
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 hover:border-primary-300 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-2 focus:ring-primary-400 transition-all"
                />
                <span className="text-sm text-neutral-700 font-medium hover:text-primary-600 transition-colors">
                  Se souvenir de moi
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-all"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              loading={loading}
              className="!mt-8 bg-gradient-to-r from-primary-500 via-warm-coral to-warm-sunset hover:opacity-90 text-white font-semibold py-3.5 rounded-xl shadow-warm hover:shadow-glow transition-all duration-300"
            >
              Se connecter
            </Button>
          </form>

          {/* Register Links */}
          <div className="mt-8 text-center">
            <p className="text-neutral-600 text-base">
              Pas encore de compte ?{' '}
              <Link
                href="/register"
                className="text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-all"
              >
                Créez-en un
              </Link>
            </p>
          </div>

          {/* Quick Role Registration */}
          <div className="mt-8 pt-8 border-t border-neutral-200">
            <p className="text-center text-sm font-semibold text-neutral-600 mb-4">
              Créer un compte en tant que :
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/register?role=patient"
                className="relative py-5 rounded-2xl border-2 border-primary-100 bg-gradient-to-br from-white to-primary-50 hover:border-primary-400 hover:shadow-glow hover:scale-105 transition-all text-center group overflow-hidden"
              >
                <div className="text-3xl mb-1">🏥</div>
                <p className="font-bold text-neutral-800 group-hover:text-primary-700">Patient</p>
                <p className="text-xs text-neutral-600">Prendre rendez-vous</p>
              </Link>
              <Link
                href="/register?role=doctor"
                className="relative py-5 rounded-2xl border-2 border-secondary-100 bg-gradient-to-br from-white to-secondary-50 hover:border-secondary-400 hover:shadow-glow hover:scale-105 transition-all text-center group overflow-hidden"
              >
                <div className="text-3xl mb-1">👨‍⚕️</div>
                <p className="font-bold text-neutral-800 group-hover:text-secondary-700">Praticien</p>
                <p className="text-xs text-neutral-600">Gérer mon cabinet</p>
              </Link>
            </div>
          </div>
        </Card>

        {/* Footer Legal */}
        <p className="text-center text-sm text-neutral-600 mt-10">
          En vous connectant, vous acceptez nos{' '}
          <Link href="/terms" className="text-primary-600 hover:underline font-semibold">
            Conditions d&apos;utilisation
          </Link>{' '}
          et notre{' '}
          <Link href="/privacy" className="text-primary-600 hover:underline font-semibold">
            Politique de confidentialité
          </Link>.
        </p>
      </div>
    </div>
  );
}
