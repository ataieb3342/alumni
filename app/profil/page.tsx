import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ProfileForm from '../components/ProfileForm'

async function getUserData(email: string) {
  return await client.fetch(
    `*[_type == "user" && email == $email][0]`,
    { email }
  )
}

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/connexion')
  }

  const userData = await getUserData(session.user.email)

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">Mon Profil</h1>
          
          <div className="bg-white rounded-lg shadow-md p-8">
            <ProfileForm userData={userData} />
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}