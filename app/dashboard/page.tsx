import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Link from 'next/link'

async function getUserData(email: string) {
  const user = await client.fetch(
    `*[_type == "user" && email == $email][0]{
      _id,
      firstName,
      lastName,
      email,
      userType,
      phone,
      promotionYear,
      currentStudies,
      currentJob,
      company,
      linkedIn,
      bio,
      profileImage
    }`,
    { email }
  )
  return user
}

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect('/connexion')
  }

  const userData = await getUserData(session.user.email)

  const userTypeLabels: Record<string, string> = {
    current_student: 'Élève actuel',
    alumni: 'Ancien élève',
    staff: 'Personnel',
  }

  const isProfileComplete = userData.phone && userData.bio && (
    userData.userType === 'current_student' ? userData.currentStudies :
    userData.userType === 'alumni' ? userData.currentJob :
    userData.userType === 'staff' ? userData.currentJob : false
  )

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Bienvenue, {userData.firstName} !
            </h1>
            <p className="text-gray-600 text-lg">
              {userTypeLabels[userData.userType]}
            </p>
          </div>

          {!isProfileComplete && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-yellow-800">
                    Profil incomplet
                  </h3>
                  <p className="mt-2 text-yellow-700">
                    Complétez votre profil pour apparaître dans l&apos;annuaire et profiter pleinement de la plateforme.
                  </p>
                  <Link
                    href="/profil"
                    className="mt-3 inline-block bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-6 py-2 rounded font-semibold transition"
                  >
                    Compléter mon profil
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 - Mon profil */}
            <Link href="/profil" className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition group">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">👤</div>
                {!isProfileComplete && (
                  <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded font-semibold">
                    À compléter
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-blue-900">
                Mon profil
              </h3>
              <p className="text-gray-600">
                Gérez vos informations personnelles et professionnelles
              </p>
            </Link>

            {/* Card 2 - Annuaire */}
            <Link href="/annuaire" className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition group">
              <div className="text-4xl mb-4">📖</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-blue-900">
                Annuaire
              </h3>
              <p className="text-gray-600">
                Découvrez les anciens élèves et le personnel du lycée
              </p>
            </Link>

            {/* Card 3 - Blog */}
            <Link href="/blog" className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition group">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-blue-900">
                Blog
              </h3>
              <p className="text-gray-600">
                Lisez les derniers articles et actualités
              </p>
            </Link>
          </div>

          {/* Infos rapides */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Vos informations
            </h2>
            <dl className="grid md:grid-cols-2 gap-4">
              <div>
                <dt className="text-gray-600 text-sm">Email</dt>
                <dd className="font-semibold text-gray-900">{userData.email}</dd>
              </div>
              <div>
                <dt className="text-gray-600 text-sm">Type de membre</dt>
                <dd className="font-semibold text-gray-900">{userTypeLabels[userData.userType]}</dd>
              </div>
              {userData.promotionYear && (
                <div>
                  <dt className="text-gray-600 text-sm">Promotion</dt>
                  <dd className="font-semibold text-gray-900">{userData.promotionYear}</dd>
                </div>
              )}
              {userData.phone && (
                <div>
                  <dt className="text-gray-600 text-sm">Téléphone</dt>
                  <dd className="font-semibold text-gray-900">{userData.phone}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}