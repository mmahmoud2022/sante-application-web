import Link from 'next/link'
import { Calendar, Users, Video, Shield, Clock, Heart } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-primary-500 to-secondary-500 p-2 rounded-xl shadow-medical">
              <Heart className="h-6 w-6 text-white" fill="white" />
            </div>
            <span className="text-2xl font-heading font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Santé</span>
          </div>
          <div className="space-x-4">
            <Link href="/login" className="text-neutral-600 hover:text-primary-600 font-medium transition-colors">
              Se connecter
            </Link>
            <Link 
              href="/register" 
              className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2.5 rounded-xl hover:shadow-medical transition-all font-semibold"
            >
              S&apos;inscrire
            </Link>
          </div>
        </nav>

        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-neutral-800 mb-6 leading-tight">
            Votre santé, notre <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">priorité</span>
          </h1>
          <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
            Prenez rendez-vous avec les meilleurs professionnels de santé en quelques clics.
            Consultations en ligne et en cabinet médical.
          </p>
          <div className="flex justify-center space-x-4 flex-wrap gap-4">
            <Link 
              href="/search-doctors" 
              className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-xl hover:shadow-large transition-all text-lg font-semibold inline-flex items-center gap-2 group"
            >
              <Calendar className="h-5 w-5 group-hover:scale-110 transition-transform" />
              Trouver un médecin
            </Link>
            <Link 
              href="/register?role=doctor" 
              className="bg-white text-primary-600 border-2 border-primary-500 px-8 py-4 rounded-xl hover:bg-primary-50 hover:border-primary-600 transition-all text-lg font-semibold inline-flex items-center gap-2 shadow-medium hover:shadow-large"
            >
              <Users className="h-5 w-5" />
              Espace praticien
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-heading font-bold text-center text-neutral-800 mb-12">
          Pourquoi choisir <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">Santé</span> ?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Calendar className="h-12 w-12 text-primary-500" strokeWidth={1.5} />}
            title="Prise de rendez-vous facile"
            description="Réservez votre consultation en quelques clics, 24h/24 et 7j/7"
          />
          <FeatureCard
            icon={<Video className="h-12 w-12 text-secondary-500" strokeWidth={1.5} />}
            title="Téléconsultation"
            description="Consultez votre médecin par vidéo depuis chez vous en toute sécurité"
          />
          <FeatureCard
            icon={<Users className="h-12 w-12 text-accent-purple" strokeWidth={1.5} />}
            title="Dossier médical partagé"
            description="Accédez à votre historique médical et partagez-le avec vos praticiens"
          />
          <FeatureCard
            icon={<Clock className="h-12 w-12 text-accent-warning" strokeWidth={1.5} />}
            title="Rappels automatiques"
            description="Ne manquez plus jamais un rendez-vous avec nos rappels par email et SMS"
          />
          <FeatureCard
            icon={<Shield className="h-12 w-12 text-accent-success" strokeWidth={1.5} />}
            title="Sécurité & confidentialité"
            description="Vos données de santé sont protégées et conformes aux normes HDS"
          />
          <FeatureCard
            icon={<Heart className="h-12 w-12 text-accent-error" strokeWidth={1.5} />}
            title="Suivi personnalisé"
            description="Bénéficiez d&apos;un suivi médical personnalisé et continu"
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-16 mt-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="container mx-auto px-4 relative z-10">
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
                <li><Link href="/search-doctors" className="hover:text-primary-400 transition-colors">Trouver un médecin</Link></li>
                <li><Link href="/specialties" className="hover:text-primary-400 transition-colors">Spécialités</Link></li>
                <li><Link href="/how-it-works" className="hover:text-primary-400 transition-colors">Comment ça marche</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Praticiens</h4>
              <ul className="space-y-2 text-neutral-300">
                <li><Link href="/register?role=doctor" className="hover:text-primary-400 transition-colors">Rejoindre Santé</Link></li>
                <li><Link href="/pricing" className="hover:text-primary-400 transition-colors">Tarifs</Link></li>
                <li><Link href="/features" className="hover:text-primary-400 transition-colors">Fonctionnalités</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">À propos</h4>
              <ul className="space-y-2 text-neutral-300">
                <li><Link href="/about" className="hover:text-primary-400 transition-colors">À propos de nous</Link></li>
                <li><Link href="/contact" className="hover:text-primary-400 transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-primary-400 transition-colors">Confidentialité</Link></li>
                <li><Link href="/terms" className="hover:text-primary-400 transition-colors">CGU</Link></li>
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
    <div className="bg-white p-8 rounded-2xl shadow-soft hover:shadow-large transition-all duration-300 hover:-translate-y-2 border border-neutral-100 group">
      <div className="mb-4 inline-block p-3 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-heading font-semibold text-neutral-800 mb-2">{title}</h3>
      <p className="text-neutral-600 leading-relaxed">{description}</p>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="transform hover:scale-105 transition-transform duration-300">
      <div className="text-5xl font-heading font-bold mb-2 drop-shadow-lg">{number}</div>
      <div className="text-lg text-white/90">{label}</div>
    </div>
  )
}
