import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/ui/Toast'
import ErrorBoundary from '@/components/ErrorBoundary'
import { OnlineStatusIndicator } from '@/components/OnlineStatusIndicator'

export const metadata: Metadata = {
  title: 'Santé - Medical Appointment Platform',
  description: 'Modern medical appointment platform for patients and healthcare professionals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
  <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans bg-white text-neutral-900">
        <a href="#main-content" className="skip-to-content">
          Aller au contenu principal
        </a>
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              <main id="main-content">
                {children}
              </main>
            </AuthProvider>
          </ToastProvider>
          <OnlineStatusIndicator />
        </ErrorBoundary>
      </body>
    </html>
  )
}
