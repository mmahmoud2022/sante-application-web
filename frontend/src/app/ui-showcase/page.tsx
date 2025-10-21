'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { ThemeToggle, ThemeToggleExpanded } from '@/components/ui/ThemeToggle';
import { useToast } from '@/components/ui/Toast';
import {
  StethoscopeIcon,
  PrescriptionIcon,
  VaccineIcon,
  HeartRateIcon,
  BloodTestIcon,
  MedicalRecordIcon,
  AppointmentIcon,
  PillIcon,
  DoctorIcon,
  EmergencyIcon,
  LabIcon,
  XRayIcon,
} from '@/components/ui/MedicalIcons';
import { Heart, ArrowLeft } from 'lucide-react';

export default function UIShowcase() {
  const { showToast } = useToast();
  const [inputValue, setInputValue] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleButtonClick = (type: 'success' | 'error' | 'info' | 'warning') => {
    const messages = {
      success: 'Opération réussie !',
      error: 'Une erreur est survenue',
      info: 'Information importante',
      warning: 'Attention requise',
    };
    showToast(messages[type], type);
  };

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Chargement terminé !', 'success');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 shadow-sm border-b border-neutral-100 dark:border-neutral-700 transition-colors">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="bg-gradient-to-br from-primary-500 to-secondary-500 p-2 rounded-xl shadow-medical">
                  <Heart className="h-6 w-6 text-white" fill="white" />
                </div>
                <span className="text-2xl font-heading font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Santé
                </span>
              </Link>
              <Link 
                href="/"
                className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-heading font-bold text-neutral-800 dark:text-neutral-100 mb-2">
            Démonstration des Fonctionnalités UI
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Mode sombre, micro-interactions, accessibilité WCAG 2.1 AAA, et icônes médicales
          </p>
        </div>

        {/* Theme Toggle Section */}
        <Card className="mb-8" as="section">
          <CardHeader>
            <CardTitle>🌓 Sélecteur de Thème</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-neutral-600 dark:text-neutral-300">
              Choisissez votre thème préféré. Le mode système suit automatiquement les préférences de votre appareil.
            </p>
            <ThemeToggleExpanded />
          </CardContent>
        </Card>

        {/* Buttons Section */}
        <Card className="mb-8" as="section">
          <CardHeader>
            <CardTitle>🎯 Boutons avec Micro-interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Variantes de boutons :</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" onClick={() => handleButtonClick('success')}>
                    Primaire
                  </Button>
                  <Button variant="secondary" onClick={() => handleButtonClick('info')}>
                    Secondaire
                  </Button>
                  <Button variant="outline" onClick={() => handleButtonClick('warning')}>
                    Contour
                  </Button>
                  <Button variant="danger" onClick={() => handleButtonClick('error')}>
                    Danger
                  </Button>
                  <Button variant="ghost">
                    Ghost
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Tailles :</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Petit</Button>
                  <Button size="md">Moyen</Button>
                  <Button size="lg">Grand</Button>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">États :</p>
                <div className="flex flex-wrap gap-3">
                  <Button loading={loading} onClick={handleLoadingDemo}>
                    {loading ? 'Chargement...' : 'Démarrer chargement'}
                  </Button>
                  <Button disabled>Désactivé</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Icons Section */}
        <Card className="mb-8" as="section">
          <CardHeader>
            <CardTitle>🏥 Bibliothèque d&apos;Icônes Médicales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-neutral-600 dark:text-neutral-300">
              Icônes médicales personnalisées, conformes WCAG AAA, avec support du mode sombre.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { Icon: StethoscopeIcon, label: 'Stéthoscope' },
                { Icon: PrescriptionIcon, label: 'Prescription' },
                { Icon: VaccineIcon, label: 'Vaccin' },
                { Icon: HeartRateIcon, label: 'Fréquence cardiaque' },
                { Icon: BloodTestIcon, label: 'Test sanguin' },
                { Icon: MedicalRecordIcon, label: 'Dossier médical' },
                { Icon: AppointmentIcon, label: 'Rendez-vous' },
                { Icon: PillIcon, label: 'Médicament' },
                { Icon: DoctorIcon, label: 'Médecin' },
                { Icon: EmergencyIcon, label: 'Urgence' },
                { Icon: LabIcon, label: 'Laboratoire' },
                { Icon: XRayIcon, label: 'Radiographie' },
              ].map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors hover-lift"
                >
                  <Icon size={40} className="text-primary-600 dark:text-primary-400" />
                  <span className="text-xs text-center text-neutral-600 dark:text-neutral-400">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Interactive Cards Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card hover shadow="md" as="article">
            <StethoscopeIcon size={48} className="text-primary-500 mb-4" />
            <CardTitle as="h2" className="mb-2">
              Consultation
            </CardTitle>
            <CardContent>
              <p>Effet de survol avec élévation et ombre dynamique</p>
            </CardContent>
          </Card>

          <Card hover shadow="md" as="article">
            <AppointmentIcon size={48} className="text-secondary-500 mb-4" />
            <CardTitle as="h2" className="mb-2">
              Rendez-vous
            </CardTitle>
            <CardContent>
              <p>Animation fluide et indicateur visuel au survol</p>
            </CardContent>
          </Card>

          <Card hover shadow="md" as="article">
            <PrescriptionIcon size={48} className="text-accent-purple mb-4" />
            <CardTitle as="h2" className="mb-2">
              Prescriptions
            </CardTitle>
            <CardContent>
              <p>Transitions douces et retour d&apos;information tactile</p>
            </CardContent>
          </Card>
        </div>

        {/* Forms Section */}
        <Card className="mb-8" as="section">
          <CardHeader>
            <CardTitle>♿ Formulaires Accessibles (WCAG 2.1 AAA)</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <Input
                label="Nom complet"
                placeholder="Entrez votre nom"
                required
                helperText="Nom et prénom"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              
              <Input
                type="email"
                label="Adresse e-mail"
                placeholder="exemple@email.com"
                required
                error={inputValue && !inputValue.includes('@') ? 'Adresse e-mail invalide' : undefined}
              />
              
              <Select
                label="Spécialité médicale"
                required
                options={[
                  { value: '', label: 'Sélectionnez une spécialité' },
                  { value: 'general', label: 'Médecine générale' },
                  { value: 'cardio', label: 'Cardiologie' },
                  { value: 'dermato', label: 'Dermatologie' },
                  { value: 'pediatrie', label: 'Pédiatrie' },
                ]}
              />
              
              <TextArea
                label="Message"
                placeholder="Décrivez votre demande..."
                rows={4}
                helperText="Maximum 500 caractères"
              />
              
              <div className="flex gap-3">
                <Button type="submit" variant="primary">
                  Soumettre
                </Button>
                <Button type="reset" variant="outline">
                  Réinitialiser
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Accessibility Features */}
        <Card as="section">
          <CardHeader>
            <CardTitle>♿ Fonctionnalités d&apos;Accessibilité</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-neutral-600 dark:text-neutral-300">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span><strong>Contraste des couleurs :</strong> Tous les ratios respectent WCAG 2.1 AAA (7:1 pour le texte normal)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span><strong>Navigation au clavier :</strong> Tous les éléments interactifs sont accessibles au clavier</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span><strong>Lecteurs d&apos;écran :</strong> ARIA labels, roles et descriptions pour tous les composants</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span><strong>Indicateurs de focus :</strong> Contours visibles sur tous les éléments focalisables</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span><strong>Liens d&apos;évitement :</strong> Lien &quot;Aller au contenu principal&quot; en haut de chaque page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span><strong>Mouvement réduit :</strong> Respect de prefers-reduced-motion pour les animations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span><strong>Mode contraste élevé :</strong> Support de prefers-contrast pour les bordures</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-neutral-800 border-t border-neutral-100 dark:border-neutral-700 mt-16 py-8 transition-colors">
        <div className="container mx-auto px-4 text-center text-neutral-600 dark:text-neutral-400">
          <p>&copy; 2024 Santé. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
