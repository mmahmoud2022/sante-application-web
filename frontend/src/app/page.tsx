import Link from 'next/link'
import { Calendar, Users, Video, Shield, Clock, Heart } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-heading font-bold text-primary">Santé</span>
          </div>
          <div className="space-x-4">
            <Link href="/login" className="text-neutral-600 hover:text-primary transition-colors">
              Se connecter
            </Link>
            <Link 
              href="/register" 
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              S&apos;inscrire
            </Link>
          </div>
        </nav>

        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-neutral-800 mb-6">
            Votre santé, notre priorité
          </h1>
          <p className="text-xl text-neutral-600 mb-8">
            Prenez rendez-vous avec les meilleurs professionnels de santé en quelques clics.
            Consultations en ligne et en cabinet médical.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/search-doctors" 
              className="bg-primary text-white px-8 py-4 rounded-xl hover:bg-primary-dark transition-all shadow-medium hover:shadow-lg text-lg font-semibold"
            >
              Trouver un médecin
            </Link>
            <Link 
              href="/register?role=doctor" 
              className="bg-white text-primary border-2 border-primary px-8 py-4 rounded-xl hover:bg-primary hover:text-white transition-all shadow-medium text-lg font-semibold"
            >
              Espace praticien
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-heading font-bold text-center text-neutral-800 mb-12">
          Pourquoi choisir Santé ?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Calendar className="h-12 w-12 text-primary" />}
            title="Prise de rendez-vous facile"
            description="Réservez votre consultation en quelques clics, 24h/24 et 7j/7"
          />
          <FeatureCard
            icon={<Video className="h-12 w-12 text-primary" />}
            title="Téléconsultation"
            description="Consultez votre médecin par vidéo depuis chez vous en toute sécurité"
          />
          <FeatureCard
            icon={<Users className="h-12 w-12 text-primary" />}
            title="Dossier médical partagé"
            description="Accédez à votre historique médical et partagez-le avec vos praticiens"
          />
          <FeatureCard
            icon={<Clock className="h-12 w-12 text-primary" />}
            title="Rappels automatiques"
            description="Ne manquez plus jamais un rendez-vous avec nos rappels par email et SMS"
          />
          <FeatureCard
            icon={<Shield className="h-12 w-12 text-primary" />}
            title="Sécurité & confidentialité"
            description="Vos données de santé sont protégées et conformes aux normes HDS"
          />
          <FeatureCard
            icon={<Heart className="h-12 w-12 text-primary" />}
            title="Suivi personnalisé"
            description="Bénéficiez d&apos;un suivi médical personnalisé et continu"
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary text-white py-16 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <StatCard number="10,000+" label="Patients actifs" />
            <StatCard number="500+" label="Médecins partenaires" />
            <StatCard number="50,000+" label="Consultations réalisées" />
            <StatCard number="98%" label="Taux de satisfaction" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-heading font-bold text-xl mb-4">Santé</h3>
              <p className="text-neutral-300">
                Votre plateforme de santé digitale de confiance
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Patients</h4>
              <ul className="space-y-2 text-neutral-300">
                <li><Link href="/search-doctors" className="hover:text-primary">Trouver un médecin</Link></li>
                <li><Link href="/specialties" className="hover:text-primary">Spécialités</Link></li>
                <li><Link href="/how-it-works" className="hover:text-primary">Comment ça marche</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Praticiens</h4>
              <ul className="space-y-2 text-neutral-300">
                <li><Link href="/register?role=doctor" className="hover:text-primary">Rejoindre Santé</Link></li>
                <li><Link href="/pricing" className="hover:text-primary">Tarifs</Link></li>
                <li><Link href="/features" className="hover:text-primary">Fonctionnalités</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">À propos</h4>
              <ul className="space-y-2 text-neutral-300">
                <li><Link href="/about" className="hover:text-primary">À propos de nous</Link></li>
                <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-primary">Confidentialité</Link></li>
                <li><Link href="/terms" className="hover:text-primary">CGU</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-700 mt-8 pt-8 text-center text-neutral-400">
            <p>&copy; 2024 Santé. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-medium transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-heading font-semibold text-neutral-800 mb-2">{title}</h3>
      <p className="text-neutral-600">{description}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-heading font-bold mb-2">{number}</div>
      <div className="text-lg">{label}</div>
    </div>
  )
}
