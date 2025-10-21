/**
 * Forgot Password Page – Modern UI
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.auth.requestPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-200 to-secondary-200 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-warm-amber/20 to-warm-rose/20 rounded-full blur-3xl opacity-40 translate-y-1/3 -translate-x-1/4"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-6 group">
            <div className="bg-gradient-to-br from-primary-500 via-warm-coral to-warm-sunset p-3 rounded-2xl shadow-warm group-hover:shadow-glow group-hover:scale-110 transition-all duration-300">
              <Heart className="h-10 w-10 text-white drop-shadow-lg" fill="white" />
            </div>
            <span className="text-3xl font-heading font-bold bg-gradient-to-r from-primary-600 via-warm-coral to-warm-sunset bg-clip-text text-transparent">
              Santé
            </span>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-neutral-800 dark:text-neutral-200 mb-2">
            Mot de passe oublié
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-base">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {/* Card */}
        <Card className="p-8 shadow-warm backdrop-blur-sm bg-white/95 border border-primary-100/50 rounded-2xl transition-all">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-2 animate-pulse">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
                Email envoyé!
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                Si un compte existe avec l&apos;email <strong>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques minutes.
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Vérifiez également votre dossier spam.
              </p>
              <Link href="/login">
                <Button variant="outline" fullWidth>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 p-4 border-l-4 border-accent-error bg-red-50/80 rounded-xl shadow-sm">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Adresse email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-slate-800 transition-all"
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Entrez l&apos;email associé à votre compte
                </p>
              </div>

              <Button type="submit" fullWidth loading={loading} className="mt-4">
                Envoyer le lien
              </Button>

              <div className="pt-4">
                <Link href="/login">
                  <Button variant="ghost" fullWidth>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            </form>
          )}
        </Card>

        {!success && (
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Besoin d&apos;aide ?{' '}
              <Link href="/contact" className="text-primary hover:text-primary-dark font-medium transition-colors">
                Contactez le support
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
