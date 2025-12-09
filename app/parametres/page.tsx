import { redirect } from 'next/navigation'
import { logger } from '@/lib/logger'
import { auth } from '@/lib/auth'
import { client } from '@/sanity/lib/client'
import { newsletterSubscriptionQuery } from '@/sanity/lib/queries'
import SettingsForm from '@/app/components/SettingsForm'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'

export const metadata = {
  title: 'Mes Paramètres - Association VH Besançon',
  description: 'Gérez vos préférences et votre compte',
}

export default async function ParametresPage() {
  // Vérifier l'authentification
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/connexion?callbackUrl=/parametres')
  }

  // Récupérer les préférences newsletter de l'utilisateur
  let newsletterPreferences = {
    generalNewsletter: false,
    announcementsNewsletter: false,
  }

  try {
    const subscription = await client.fetch(newsletterSubscriptionQuery, {
      userId: session.user.id,
    })

    if (subscription) {
      newsletterPreferences = {
        generalNewsletter: subscription.generalNewsletter || false,
        announcementsNewsletter: subscription.announcementsNewsletter || false,
      }
    }
  } catch (error) {
    logger.error('Erreur lors de la récupération des préférences:', error)
    // Continuer avec les valeurs par défaut
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres</h1>
            <p className="text-gray-600">Gérez votre compte et vos préférences</p>
          </div>

          <SettingsForm
            user={{
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.name || '',
            }}
            initialPreferences={newsletterPreferences}
          />
        </section>
      </main>

      <Footer />
    </>
  )
}
