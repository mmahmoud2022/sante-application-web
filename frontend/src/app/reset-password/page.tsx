/**
 * Reset Password Page
 * Allows users to reset their password using a token from email
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError('Token de réinitialisation manquant');
      setValidatingToken(false);
      return;
    }

    const validateToken = async () => {
      try {
        await api.auth.validateResetToken(token);
        setTokenValid(true);
      } catch (err) {
        setError('Token invalide ou expiré');
        setTokenValid(false);
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const validatePassword = () => {
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      await api.auth.resetPassword(token!, password);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return null;
    if (password.length < 8) return { text: 'Faible', color: 'bg-red-500' };
    if (password.length < 12) return { text: 'Moyen', color: 'bg-yellow-500' };
    return { text: 'Fort', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

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
            Nouveau mot de passe
          </h1>
          <p className="text-neutral-600">
            Choisissez un mot de passe sécurisé
          </p>
        </div>

        {/* Form or Messages */}
        <Card>
          {validatingToken ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-neutral-600">Validation du lien...</p>
            </div>
          ) : !tokenValid ? (
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-2">
                Lien invalide
              </h2>
              <p className="text-neutral-600 mb-6">
                Le lien de réinitialisation est invalide ou a expiré.
              </p>
              <Link href="/forgot-password">
                <Button fullWidth>
                  Demander un nouveau lien
                </Button>
              </Link>
            </div>
          ) : success ? (
            <div className="text-center py-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-2">
                Mot de passe réinitialisé!
              </h2>
              <p className="text-neutral-600 mb-6">
                Votre mot de passe a été modifié avec succès.
              </p>
              <p className="text-sm text-neutral-500">
                Redirection vers la connexion...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-neutral-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-neutral-400" />
                    )}
                  </button>
                </div>
                {passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-neutral-600">Force du mot de passe</span>
                      <span className={passwordStrength.color.replace('bg-', 'text-')}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all`}
                        style={{
                          width: password.length < 8 ? '33%' : password.length < 12 ? '66%' : '100%',
                        }}
                      />
                    </div>
                  </div>
                )}
                <p className="mt-1.5 text-xs text-neutral-500">
                  Minimum 8 caractères recommandés
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-neutral-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-neutral-400" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-600">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={!password || !confirmPassword || password !== confirmPassword}
                className="mt-6"
              >
                Réinitialiser le mot de passe
              </Button>
            </form>
          )}
        </Card>

        {/* Additional Help */}
        {!success && tokenValid && (
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              <Link href="/login" className="text-primary hover:text-primary-dark font-medium">
                Retour à la connexion
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
