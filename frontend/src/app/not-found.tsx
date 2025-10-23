/**
 * Global Not Found Page
 * Provides a modern error layout with navigation options
 */

'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Home, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 px-6 py-16">
      <div className="relative w-full max-w-3xl text-center">
        <div className="absolute -top-24 -left-24 h-40 w-40 rounded-full bg-primary-200/40 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 -right-24 h-36 w-36 rounded-full bg-secondary-200/50 blur-3xl" aria-hidden="true" />

        <div className="relative overflow-hidden rounded-3xl border border-primary-100/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-900/80 shadow-glow backdrop-blur-lg">
          <div className="px-8 py-14 md:px-16">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary-500 dark:text-primary-300 mb-6">
              ERREUR 404
            </p>
            <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-neutral-900 dark:text-neutral-50 mb-6">
              Oups, cette page a disparu
            </h1>
            <p className="text-base md:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl mx-auto">
              Il semble que la page que vous cherchez n&apos;existe pas ou a été déplacée.
              Revenez en arrière ou explorez d&apos;autres sections de la plateforme Santé.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full sm:w-auto inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la page précédente
              </Button>

              <Link href="/" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto inline-flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Revenir à l&apos;accueil
                </Button>
              </Link>

              <Link href="/search-doctors" className="w-full sm:w-auto">
                <Button
                  variant="ghost"
                  className="w-full sm:w-auto inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-300"
                >
                  <Compass className="h-4 w-4" />
                  Explorer les praticiens
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}