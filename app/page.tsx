import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import PublicHeader from '@/app/components/PublicHeader'
import Footer from '@/app/components/Footer'
import HeroSection from '@/app/components/HeroSection'

export default async function Home() {
  const session = await auth()

  // Rediriger les utilisateurs connectés vers /blog
  if (session) {
    redirect('/accueil')
  }

  return (
    <>
      <PublicHeader />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <HeroSection />


      {/* Processus d'adhésion */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
          Comment nous rejoindre ?
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          L&apos;adhésion est gratuite et se fait en 2 étapes simples
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 mb-4">
              1
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">
              Adhérer sur HelloAsso
            </h3>
            <p className="text-gray-600 mb-6">
              Inscrivez-vous gratuitement à l&apos;association via notre page HelloAsso.
              C&apos;est rapide, gratuit et sécurisé.
            </p>
            <a
              href="https://www.helloasso.com/associations/vh-besancon-alumni"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Adhérer sur HelloAsso
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl font-bold text-green-600 mb-4">
              2
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">
              Créer votre compte
            </h3>
            <p className="text-gray-600 mb-6">
              Créez ensuite votre compte sur ce site pour accéder à l&apos;annuaire,
              au forum d&apos;annonces et aux newsletters.
            </p>
            <Link
              href="/inscription"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Créer mon compte
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Services membres */}
      <section className="bg-gradient-to-br from-white to-blue-50/20 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
            L&apos;espace membres
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Une fois membre, accédez à toutes les fonctionnalités de la plateforme
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-8 shadow-md">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Annuaire</h3>
              <p className="text-gray-700 mb-4">
                Retrouvez vos anciens camarades, développez votre réseau professionnel
                et restez en contact avec la communauté VH.
              </p>
              <Link href="/connexion" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                Découvrir l&apos;annuaire
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-8 shadow-md">
              <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Forum d&apos;annonces</h3>
              <p className="text-gray-700 mb-4">
                Partagez et consultez des offres d&apos;emploi, de stage et des opportunités
                professionnelles au sein de la communauté.
              </p>
              <Link href="/connexion" className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1">
                Voir les annonces
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-8 shadow-md">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Événements</h3>
              <p className="text-gray-700 mb-4">
                Participez aux événements de l&apos;association, rencontres, conférences
                et retrouvailles organisées tout au long de l&apos;année.
              </p>
              <Link href="/connexion" className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1">
                Découvrir les événements
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Appel aux dons */}
      <section className="bg-gradient-to-r from-yellow-50 to-orange-50 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-5xl mb-6">💝</div>
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            Soutenez l&apos;association
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            VH Besançon Alumni fonctionne grâce à vos dons et contributions.
            Aidez-nous à maintenir et développer la plateforme pour toute la communauté.
          </p>
          <a
            href="https://www.helloasso.com/associations/vh-besancon-alumni"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-orange-600 text-white px-8 py-4 rounded-lg hover:bg-orange-700 transition-colors font-bold text-lg"
          >
            Faire un don
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </a>
        </div>
      </section>

      <Footer />
    </main>
    </>
  )
}