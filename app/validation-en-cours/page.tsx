import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PublicHeader from '../components/PublicHeader'
import Footer from '../components/Footer'
import Link from 'next/link'

export default async function ValidationEnCoursPage() {
  const session = await auth()

  // Si connecté et compte actif, rediriger vers l'accueil
  if (session?.user?.accountStatus === 'active') {
    redirect('/accueil')
  }

  return (
    <>
      <PublicHeader />

      <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Validation en cours
            </h1>

            <p className="text-gray-600 mb-6">
              Votre compte a bien été créé ! Un administrateur va examiner votre demande d&apos;inscription.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                📧 Vous recevrez un email de confirmation dès que votre compte sera validé.
              </p>
            </div>

            {session?.user ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Inscrit en tant que : <strong>{session.user.name}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Email : <strong>{session.user.email}</strong>
                </p>
              </div>
            ) : null}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link
                href="/connexion"
                className="text-blue-900 hover:underline text-sm font-medium"
              >
                Retour à la page de connexion
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
