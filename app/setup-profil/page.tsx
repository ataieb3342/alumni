import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PublicHeader from '../components/PublicHeader'
import Footer from '../components/Footer'
import SetupProfileForm from './SetupProfileForm'

export default async function SetupProfilePage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/connexion')
  }

  return (
    <>
      <PublicHeader />

      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h1 className="text-3xl font-bold text-center mb-4 text-gray-900">
              Complétez votre profil
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Bienvenue {session.user.name} ! Complétez quelques informations pour finaliser votre inscription.
            </p>

            <SetupProfileForm />
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
