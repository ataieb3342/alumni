import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { directoryUsersQuery } from '@/sanity/lib/queries'
import Header from '../components/Header'
import Footer from '../components/Footer'
import DirectoryList from '../components/DirectoryList'

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  userType: string
  phone?: string
  promotionYear?: number
  currentJob?: string
  company?: string
  linkedIn?: string
  bio?: string
  profileImage?: {
    asset: {
      _id: string
      url: string
    }
  }
}

export default async function AnnuairePage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/connexion')
  }

  const users = await client.fetch<User[]>(directoryUsersQuery)

  // Séparer les alumni et le personnel
  const alumni = users.filter((u) => u.userType === 'alumni')
  const staff = users.filter((u) => u.userType === 'staff')

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Annuaire</h1>
            <p className="text-gray-600">
              Retrouvez les anciens élèves et le personnel du Lycée Victor Hugo
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total</p>
                  <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Anciens élèves</p>
                  <p className="text-3xl font-bold text-blue-900">{alumni.length}</p>
                </div>
                <div className="text-4xl">🎓</div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Personnel</p>
                  <p className="text-3xl font-bold text-green-600">{staff.length}</p>
                </div>
                <div className="text-4xl">👨‍🏫</div>
              </div>
            </div>
          </div>

          {/* Liste des membres */}
          <DirectoryList alumni={alumni} staff={staff} />
        </div>
      </main>
      
      <Footer />
    </>
  )
}