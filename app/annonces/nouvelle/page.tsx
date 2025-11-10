import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AnnouncementForm from '@/app/components/AnnouncementForm'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'

export const metadata = {
  title: 'Publier une annonce - Association VH Besançon',
  description: 'Partagez une opportunité avec la communauté',
}

export default async function NewAnnouncementPage() {
  // Vérifier l'authentification
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/connexion?callbackUrl=/annonces/nouvelle')
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Publier une annonce</h1>
            <p className="text-gray-600">
              Partagez une opportunité professionnelle, un stage, un événement ou toute autre information utile avec la communauté.
            </p>
          </div>

          <AnnouncementForm userId={session.user.id} />
        </section>
      </main>

      <Footer />
    </>
  )
}
