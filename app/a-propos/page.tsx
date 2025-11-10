import { auth } from '@/lib/auth'
import Header from '../components/Header'
import PublicHeader from '../components/PublicHeader'
import Footer from '../components/Footer'
import HeroSection from '../components/HeroSection'

export const metadata = {
  title: 'À propos - VH Besançon Alumni',
  description: 'Découvrez l\'association des anciens élèves et personnels du Lycée Victor Hugo de Besançon',
}

export default async function AProposPage() {
  const session = await auth()

  return (
    <>
      {session?.user ? <Header /> : <PublicHeader />}

      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Hero Section avec image en background */}
        <HeroSection
          title="À propos"
          subtitle="L'association qui connecte les anciens élèves et personnels du Lycée Victor Hugo"
        />

        {/* Contenu */}
        <div className="max-w-7xl mx-auto px-6 py-16 -mt-10">
          {/* Notre Mission */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre Mission</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>VH Besançon Alumni</strong> est l&apos;association des anciens élèves et personnels
                  du Lycée Victor Hugo de Besançon. Notre mission est de créer et maintenir un réseau
                  professionnel et amical entre tous ceux qui ont un lien avec notre établissement.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Que vous soyez ancien élève, personnel enseignant ou administratif, ou encore élève
                  actuellement en cours de scolarité, nous vous offrons un espace pour rester connectés,
                  partager des opportunités et vous entraider tout au long de votre parcours professionnel.
                </p>
                  </div>
                </div>
          </section>

          {/* Nos Services */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Ce que nous proposons</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-md p-6 border border-blue-100 hover:shadow-lg transition-shadow duration-300">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Annuaire des Membres</h3>
                  <p className="text-gray-600">
                Accédez à un annuaire complet des anciens élèves et personnels. Retrouvez vos anciens
                camarades et développez votre réseau professionnel.
              </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-md p-6 border border-blue-100 hover:shadow-lg transition-shadow duration-300">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Forum d&apos;Annonces</h3>
                  <p className="text-gray-600">
                Partagez et consultez des offres d&apos;emploi, de stage, des opportunités professionnelles
                et des événements au sein de notre communauté.
              </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-md p-6 border border-blue-100 hover:shadow-lg transition-shadow duration-300">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Actualités</h3>
                  <p className="text-gray-600">
                Restez informé des dernières nouvelles de l&apos;association, des événements à venir
                et des actualités de la communauté VH.
              </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-md p-6 border border-blue-100 hover:shadow-lg transition-shadow duration-300">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Newsletters</h3>
                  <p className="text-gray-600">
                Recevez nos actualités et les nouvelles opportunités directement dans votre boîte mail
                selon vos préférences.
              </p>
                </div>
              </div>
            </div>
          </section>

          {/* Comment nous soutenir */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Comment nous soutenir</h2>
              <p className="text-gray-700 mb-6">
                VH Besançon Alumni est une association qui fonctionne <strong>grâce à vos dons et adhésions</strong>.
                Toutes les contributions nous permettent de maintenir et développer la plateforme pour la communauté.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 shadow-md border border-blue-100 hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">💝 Faire un don</h3>
                  <p className="text-gray-600 mb-4">
                    Votre don nous aide à financer les outils, l&apos;hébergement et les événements de l&apos;association.
                  </p>
                  <a
                    href="https://www.helloasso.com/associations/vh-besancon-alumni"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Faire un don sur HelloAsso
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 shadow-md border border-blue-100 hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">✨ Adhérer (gratuit)</h3>
                  <p className="text-gray-600 mb-4">
                    L&apos;adhésion est gratuite et vous donne accès à toutes les fonctionnalités : annuaire, forum d&apos;annonces, newsletters...
                  </p>
                  <a
                    href="https://www.helloasso.com/associations/vh-besancon-alumni"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Adhérer sur HelloAsso
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="mt-6 p-6 bg-blue-600 text-white rounded-xl shadow-lg">
                <p className="text-md flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <span>
                    <strong>Bon à savoir:</strong> Après avoir adhéré sur HelloAsso,
                    créez votre compte sur ce site pour accéder à toutes les fonctionnalités.
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Nous contacter</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-3">Par email</h3>
                  <p className="text-gray-600">
                    <a href="mailto:contact@vh-besancon-alumni.fr" className="text-blue-600 hover:text-blue-700 font-medium">
                      contact@vh-besancon-alumni.fr
                    </a>
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100">
                  <h3 className="font-semibold text-gray-900 mb-3">Adresse</h3>
                  <p className="text-gray-600">
                    Lycée Victor Hugo<br/>
                    1 rue Rembrandt<br/>
                    25000 Besançon
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Suivez-nous</h3>
                <div className="flex gap-4">
                  <a
                    href="https://linkedin.com/company/vh-besancon-alumni/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    LinkedIn
                  </a>
                  <a
                    href="https://www.instagram.com/vh_besancon_alumni/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Instagram
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}
