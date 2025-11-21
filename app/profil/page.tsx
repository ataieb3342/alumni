import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ProfileForm from '../components/ProfileForm'

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
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
            <p className="text-gray-600">Gérez vos informations personnelles et professionnelles</p>
          </div>

          <ProfileForm userData={userData} />
        </section>
      </main>

      <Footer />
    </>
  )
}