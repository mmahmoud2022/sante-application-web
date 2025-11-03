/**
 * Email Verification Page
 * Verifies user email using token from verification email
 */

'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, CheckCircle, AlertCircle, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailResent, setEmailResent] = useState(false);

  const verifyEmail = useCallback(async () => {
    try {
      await api.auth.verifyEmail(token!);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Le lien de vérification est invalide ou a expiré.'
      );
    } finally {
      setVerifying(false);
    }
  }, [router, token]);

  useEffect(() => {
    if (!token) {
      setError('Token de vérification manquant');
      setVerifying(false);
      return;
    }

    void verifyEmail();
  }, [token, verifyEmail]);

  const handleResendEmail = async () => {
    setResendingEmail(true);
    try {
      // This would need the user's email - in practice, you might store it in localStorage
      // or require the user to enter it
      await api.auth.resendVerificationEmail();
      setEmailResent(true);
    } catch (err: any) {
      alert('Erreur lors de l\'envoi de l\'email de vérification');
    } finally {
      setResendingEmail(false);
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
            Vérification de l&apos;email
          </h1>
          <p className="text-neutral-600">
            Confirmez votre adresse email pour activer votre compte
          </p>
        </div>

        {/* Verification Result */}
        <Card>
          {verifying ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-neutral-600">Vérification en cours...</p>
            </div>
          ) : success ? (
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-2">
                Email vérifié!
              </h2>
              <p className="text-neutral-600 mb-6">
                Votre adresse email a été vérifiée avec succès. Vous pouvez maintenant vous connecter.
              </p>
              <p className="text-sm text-neutral-500 mb-6">
                Redirection automatique vers la page de connexion...
              </p>
              <Link href="/login">
                <Button fullWidth>
                  Se connecter maintenant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-2">
                Vérification échouée
              </h2>
              <p className="text-neutral-600 mb-6">
                {error}
              </p>

              {emailResent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-800">
                    Un nouvel email de vérification a été envoyé. Vérifiez votre boîte de réception.
                  </p>
                </div>
              ) : (
                <Button
                  onClick={handleResendEmail}
                  loading={resendingEmail}
                  fullWidth
                  className="mb-4"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Renvoyer l&apos;email de vérification
                </Button>
              )}

              <Link href="/login">
                <Button variant="outline" fullWidth>
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Additional Help */}
        {!verifying && !success && (
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
