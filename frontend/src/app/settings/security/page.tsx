/**
 * Two-Factor Authentication Setup Page
 * Allows users to enable/disable 2FA for their account
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Shield, Smartphone, Mail, CheckCircle, AlertCircle,
  Copy, RefreshCw, ChevronLeft, Eye, EyeOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

type TwoFactorMethod = 'sms' | 'email' | 'app';

export default function TwoFactorAuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod>('sms');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  
  const [step, setStep] = useState<'select' | 'verify' | 'complete'>('select');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadTwoFactorStatus();
    }
  }, [user, loading, router]);

  const loadTwoFactorStatus = async () => {
    try {
      const response = await api.users.getTwoFactorStatus();
      setTwoFactorEnabled(response.data.enabled);
      if (response.data.method) {
        setSelectedMethod(response.data.method);
      }
    } catch (error) {
      console.error('Failed to load 2FA status:', error);
    }
  };

  const handleSendVerificationCode = async () => {
    setError('');
    setSendingCode(true);

    try {
      if (selectedMethod === 'sms') {
        if (!phoneNumber) {
          setError('Veuillez entrer votre numéro de téléphone');
          return;
        }
        await api.users.sendTwoFactorCode({ phone_number: phoneNumber });
        setSuccess('Code envoyé par SMS');
      } else if (selectedMethod === 'email') {
        await api.users.sendTwoFactorCode({ method: 'email' });
        setSuccess('Code envoyé par email');
      } else if (selectedMethod === 'app') {
        const response = await api.users.generateTwoFactorSecret();
        setQrCodeUrl(response.data.qr_code_url);
        setSecret(response.data.secret);
      }
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'envoi du code');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('Veuillez entrer le code de vérification');
      return;
    }

    setError('');
    setVerifying(true);

    try {
      const response = await api.users.enableTwoFactor({
        method: selectedMethod,
        code: verificationCode,
        phone_number: selectedMethod === 'sms' ? phoneNumber : undefined,
      });

      setBackupCodes(response.data.backup_codes);
      setTwoFactorEnabled(true);
      setStep('complete');
      setSuccess('Authentification à deux facteurs activée!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Code invalide. Veuillez réessayer.');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver l\'authentification à deux facteurs?')) {
      return;
    }

    try {
      await api.users.disableTwoFactor();
      setTwoFactorEnabled(false);
      setStep('select');
      setSuccess('Authentification à deux facteurs désactivée');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la désactivation');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copié!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sante-backup-codes.txt';
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Authentification à deux facteurs
                </h1>
                <p className="text-gray-600">Sécurisez votre compte</p>
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Current Status */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${twoFactorEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Shield className={`h-6 w-6 ${twoFactorEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {twoFactorEnabled ? 'Activée' : 'Désactivée'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {twoFactorEnabled
                      ? `Méthode: ${selectedMethod === 'sms' ? 'SMS' : selectedMethod === 'email' ? 'Email' : 'Application'}`
                      : 'Votre compte n\'est pas protégé par 2FA'}
                  </p>
                </div>
              </div>
              {twoFactorEnabled && (
                <Button variant="outline" onClick={handleDisableTwoFactor}>
                  Désactiver
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {!twoFactorEnabled && (
          <>
            {/* Step 1: Select Method */}
            {step === 'select' && (
              <Card>
                <CardHeader>
                  <CardTitle>Choisir une méthode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* SMS Method */}
                  <div
                    onClick={() => setSelectedMethod('sms')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedMethod === 'sms'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Smartphone className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">SMS</h3>
                        <p className="text-sm text-gray-600">
                          Recevez un code de vérification par SMS
                        </p>
                        {selectedMethod === 'sms' && (
                          <div className="mt-3">
                            <input
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="+33 6 12 34 56 78"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Email Method */}
                  <div
                    onClick={() => setSelectedMethod('email')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedMethod === 'email'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Mail className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Email</h3>
                        <p className="text-sm text-gray-600">
                          Recevez un code de vérification par email
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* App Method */}
                  <div
                    onClick={() => setSelectedMethod('app')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedMethod === 'app'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Shield className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Application d&apos;authentification
                        </h3>
                        <p className="text-sm text-gray-600">
                          Utilisez Google Authenticator, Authy, etc.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSendVerificationCode}
                    loading={sendingCode}
                    fullWidth
                    className="mt-6"
                  >
                    Continuer
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Verify */}
            {step === 'verify' && (
              <Card>
                <CardHeader>
                  <CardTitle>Vérification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedMethod === 'app' ? (
                    <>
                      <div className="text-center">
                        <p className="text-gray-600 mb-4">
                          Scannez ce QR code avec votre application d&apos;authentification
                        </p>
                        {qrCodeUrl && (
                          <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                            <Image
                              src={qrCodeUrl}
                              alt="QR Code"
                              width={192}
                              height={192}
                              className="w-48 h-48"
                              unoptimized
                            />
                          </div>
                        )}
                      </div>

                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Ou entrez ce code manuellement:</p>
                        <div className="flex items-center justify-center space-x-2">
                          <code className="px-4 py-2 bg-gray-100 rounded text-sm font-mono">
                            {showSecret ? secret : '••••••••••••••••'}
                          </code>
                          <button
                            onClick={() => setShowSecret(!showSecret)}
                            className="p-2 hover:bg-gray-100 rounded"
                          >
                            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(secret)}
                            className="p-2 hover:bg-gray-100 rounded"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">
                        {selectedMethod === 'sms'
                          ? `Un code a été envoyé au ${phoneNumber}`
                          : 'Un code a été envoyé à votre email'}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code de vérification
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent"
                      maxLength={6}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep('select')}
                      fullWidth
                    >
                      Retour
                    </Button>
                    <Button
                      onClick={handleVerifyCode}
                      loading={verifying}
                      disabled={verificationCode.length !== 6}
                      fullWidth
                    >
                      Vérifier
                    </Button>
                  </div>

                  {selectedMethod !== 'app' && (
                    <button
                      onClick={handleSendVerificationCode}
                      disabled={sendingCode}
                      className="w-full text-center text-sm text-primary hover:text-primary-dark flex items-center justify-center space-x-1"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Renvoyer le code</span>
                    </button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Complete */}
            {step === 'complete' && (
              <Card>
                <CardHeader>
                  <CardTitle>Codes de secours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> Conservez ces codes en lieu sûr. Vous pourrez les utiliser
                      pour vous connecter si vous perdez l&apos;accès à votre méthode 2FA.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm font-mono">
                          {code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(code)}
                          className="p-2 hover:bg-gray-200 rounded"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button onClick={downloadBackupCodes} fullWidth>
                    Télécharger les codes
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    fullWidth
                  >
                    Terminer
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
