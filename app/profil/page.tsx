import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ProfileForm from '../components/ProfileForm'
import Link from 'next/link'

async function getUserData(email: string) {
  return await client.fetch(
    `*[_type == "user" && email == $email][0]{
      _id,
      firstName,
      lastName,
      email,
      userType,
      promotionYear,
      currentStudies,
      linkedIn,
      bio,
      isVisibleInDirectory,
      staffCategory,
      staffDetails,
      education,
      experience,
      "profileImage": profileImage.asset->{
        _id,
        url
      },
      "coverImage": coverImage.asset->{
        _id,
        url
      }
    }`,
    { email }
  )
}

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/connexion')
  }

  const userData = await getUserData(session.user.email)

  // Si l'utilisateur n'existe pas dans Sanity, rediriger vers la page d'inscription
  if (!userData) {
    redirect('/inscription')
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
                <p className="text-gray-600">Gérez vos informations personnelles et professionnelles</p>
              </div>
              <Link
                href={`/annuaire/${userData._id}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Voir mon profil public
              </Link>
            </div>
          </div>

          <ProfileForm userData={userData} />
        </section>
      </main>

      <Footer />
    </>
  )
}