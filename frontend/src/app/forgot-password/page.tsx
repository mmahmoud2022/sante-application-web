/**
 * Forgot Password Page
 * Allows users to request a password reset email
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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <Heart className="h-10 w-10 text-primary" />
            <span className="text-3xl font-heading font-bold text-primary">Santé</span>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-neutral-800 dark:text-neutral-200 mb-2">
            Mot de passe oublié
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 dark:text-neutral-500">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {/* Form or Success Message */}
        <Card>
          {success ? (
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                Email envoyé!
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 mb-6">
                Si un compte existe avec l&apos;email <strong>{email}</strong>, 
                vous recevrez un lien de réinitialisation dans quelques minutes.
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mb-6">
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Adresse email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">
                  Entrez l&apos;email associé à votre compte
                </p>
              </div>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                className="mt-6"
              >
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

        {/* Additional Help */}
        {!success && (
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 dark:text-neutral-500">
              Besoin d&apos;aide?{' '}
              <Link href="/contact" className="text-primary hover:text-primary-dark font-medium">
                Contactez le support
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
