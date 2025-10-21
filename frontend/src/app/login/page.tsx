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
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden transition-colors duration-300">
      {/* Background Glow Effects */}
      <div className="absolute top-0 right-0 w-[28rem] h-[28rem] bg-gradient-to-br from-primary-300 to-secondary-200 dark:from-primary-600/30 dark:to-secondary-600/20 rounded-full blur-3xl opacity-30 dark:opacity-20 -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[22rem] h-[22rem] bg-gradient-to-tr from-warm-amber/30 to-warm-coral/20 dark:from-warm-amber/10 dark:to-warm-coral/10 rounded-full blur-3xl opacity-40 dark:opacity-20 translate-y-1/3 -translate-x-1/4"></div>

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

          <h1 className="text-4xl font-heading font-bold text-neutral-900 dark:text-neutral-50 mb-2">
            Bienvenue 👋
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-base font-medium">
            Connectez-vous à votre espace santé sécurisé
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 shadow-large bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-primary-100/60 dark:border-slate-700/60 rounded-3xl transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-start gap-3 p-4 border-l-4 border-accent-error bg-red-50/80 dark:bg-red-900/30 rounded-xl shadow-sm">
                <AlertCircle className="h-5 w-5 text-accent-error dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
              </div>
            )}

            {/* Verification Pending Alert */}
            {verificationPending && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-5 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-md">
                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 rounded-full border-2 border-white dark:border-neutral-800 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                      🩺 Vérification en cours
                    </h3>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3 leading-relaxed">
                      Votre compte docteur est actuellement en attente de vérification par notre équipe administrative. 
                      Cette étape est nécessaire pour garantir la sécurité et la qualité de notre plateforme.
                    </p>
                    <div className="bg-white/50 dark:bg-neutral-800/50 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                        ⏱️ Temps de traitement habituel : 24-48 heures
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                        Vous recevrez un email de confirmation dès que votre compte sera activé.
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-300">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></span>
                        En attente d&apos;approbation
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                Adresse e-mail
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-neutral-400 dark:text-neutral-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-neutral-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-primary-500 focus:border-primary-400 dark:focus:border-primary-500 hover:border-primary-300 dark:hover:border-slate-500 transition-all"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                Mot de passe
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-neutral-400 dark:text-neutral-500 group-focus-within:text-primary-500 dark:group-focus-within:text-primary-400 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-neutral-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-400 dark:focus:ring-primary-500 focus:border-primary-400 dark:focus:border-primary-500 hover:border-primary-300 dark:hover:border-slate-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-600 dark:text-primary-500 border-neutral-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded focus:ring-2 focus:ring-primary-400 dark:focus:ring-primary-500 transition-all"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  Se souvenir de moi
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline transition-all"
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
            <p className="text-neutral-600 dark:text-neutral-400 text-base">
              Pas encore de compte ?{' '}
              <Link
                href="/register"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold hover:underline transition-all"
              >
                Créez-en un
              </Link>
            </p>
          </div>

          {/* Quick Role Registration */}
          <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-slate-700">
            <p className="text-center text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-4">
              Créer un compte en tant que :
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/register?role=patient"
                className="relative py-5 rounded-2xl border-2 border-primary-100 dark:border-primary-900/50 bg-gradient-to-br from-white to-primary-50 dark:from-slate-800 dark:to-primary-950/30 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-glow hover:scale-105 transition-all text-center group overflow-hidden"
              >
                <div className="text-3xl mb-1">🏥</div>
                <p className="font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-primary-700 dark:group-hover:text-primary-400">Patient</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Prendre rendez-vous</p>
              </Link>
              <Link
                href="/register?role=doctor"
                className="relative py-5 rounded-2xl border-2 border-secondary-100 dark:border-secondary-900/50 bg-gradient-to-br from-white to-secondary-50 dark:from-slate-800 dark:to-secondary-950/30 hover:border-secondary-400 dark:hover:border-secondary-600 hover:shadow-glow hover:scale-105 transition-all text-center group overflow-hidden"
              >
                <div className="text-3xl mb-1">👨‍⚕️</div>
                <p className="font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-secondary-700 dark:group-hover:text-secondary-400">Praticien</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Gérer mon cabinet</p>
              </Link>
            </div>
          </div>
        </Card>

        {/* Footer Legal */}
        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-10">
          En vous connectant, vous acceptez nos{' '}
          <Link href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline font-semibold">
            Conditions d&apos;utilisation
          </Link>{' '}
          et notre{' '}
          <Link href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline font-semibold">
            Politique de confidentialité
          </Link>.
        </p>
      </div>
    </div>
  );
}
