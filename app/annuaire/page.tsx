import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { directoryUsersQuery } from '@/sanity/lib/queries'
import Header from '../components/Header'
import Footer from '../components/Footer'
import DirectoryList from '../components/DirectoryList'
import HeroSection from '../components/HeroSection'

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  userType: string
  promotionYear?: number
  linkedIn?: string
  bio?: string
  description?: string
  education?: Array<{
    school: string
    degree: string
    field?: string
    startYear: number
    endYear?: number
    description?: string
  }>
  experience?: Array<{
    company: string
    position: string
    location?: string
    startDate: string
    endDate?: string
    current?: boolean
    description?: string
  }>
  roleAssociation?: string[]
  personnelMetier?: string[]
  profileImage?: {
    asset: {
      _id: string
      url: string
    }
  }
  coverImage?: {
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
  // Les lycéens ne sont pas affichés dans l'annuaire (profil restreint)
  const alumni = users.filter((u) =>
    u.userType === 'alumni' ||
    u.userType === 'bts' ||
    u.userType === 'prepa'
  )
  const staff = users.filter((u) => u.userType === 'staff')

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Hero Section avec image en background */}
        <HeroSection
          title="Annuaire"
          subtitle="Retrouvez les anciens élèves et le personnel du Lycée Victor Hugo"
        />

        {/* Directory Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 -mt-10">
          <DirectoryList alumni={alumni} staff={staff} />
        </section>
      </main>

      <Footer />
    </>
  )
}