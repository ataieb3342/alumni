import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Briefcase, Check, Newspaper, Users } from 'lucide-react'
import { auth } from '@/lib/auth'
import PublicHeader from '@/app/components/PublicHeader'
import Footer from '@/app/components/Footer'
import HeroSection from '@/app/components/HeroSection'

const MEMBER_SERVICES = [
  {
    title: 'Annuaire',
    icon: Users,
    iconGradient: 'from-blue-400 to-blue-500',
    description:
      "Retrouvez vos camarades, développez votre réseau professionnel et échangez avec des anciens pour vous guider dans votre parcours.",
    features: ['Recherche avancée', 'Messagerie privée'],
  },
  {
    title: "Forum d'annonces",
    icon: Briefcase,
    iconGradient: 'from-purple-400 to-purple-500',
    description:
      "Partagez et consultez des offres d'emploi et opportunités professionnelles.",
    features: ["Offres d'emploi", 'Stages et collaborations'],
  },
  {
    title: 'Actualités',
    icon: Newspaper,
    iconGradient: 'from-green-400 to-emerald-500',
    description: 'Restez informé avec notre blog et nos newsletters mensuelles.',
    features: ['Articles & événements', 'Newsletters'],
  },
]

export default async function Home() {
  const session = await auth()

  // Rediriger les utilisateurs connectés vers leur accueil
  if (session) {
    redirect('/accueil')
  }

  return (
    <>
      <PublicHeader />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <HeroSection />

        {/* Ce que l'adhésion débloque */}
        <section className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-dots opacity-40" aria-hidden="true"></div>

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">
                Découvrez l&apos;espace membres
              </h2>
              <p className="text-blue-200">
                Des outils puissants pour développer votre réseau professionnel
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {MEMBER_SERVICES.map(({ title, icon: Icon, iconGradient, description, features }) => (
                <div
                  key={title}
                  className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${iconGradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                  </div>
                  <p className="text-blue-100 text-sm mb-4">{description}</p>
                  <ul className="space-y-2">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-blue-200">
                        <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Appel à l'adhésion — unique CTA de bas de page */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-3xl shadow-2xl p-8 md:p-12 text-center relative overflow-hidden">
            {/* Effets décoratifs */}
            <div
              className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"
              aria-hidden="true"
            ></div>
            <div
              className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24"
              aria-hidden="true"
            ></div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">
                Rejoignez VH Besançon Alumni
              </h2>
              <p className="text-pink-100 max-w-2xl mx-auto mb-8">
                Accès complet à l&apos;annuaire, aux annonces et aux newsletters. Association gérée
                bénévolement, adhésion libre et gratuite.
              </p>

              <Link
                href="/inscription"
                className="group inline-flex items-center gap-2 bg-white text-purple-700 hover:bg-purple-50 px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Adhérer gratuitement
                <ArrowRight
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  aria-hidden="true"
                />
              </Link>

              <p className="text-pink-100 text-sm mt-4">
                Déjà membre ?{' '}
                <Link href="/connexion" className="font-semibold text-white underline underline-offset-4">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}
