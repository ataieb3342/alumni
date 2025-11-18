import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { client } from '@/sanity/lib/client'
import { announcementsQuery } from '@/sanity/lib/queries'
import AnnouncementFilters from '@/app/components/AnnouncementFilters'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import HeroSection from '@/app/components/HeroSection'

export const metadata = {
  title: 'Forum des Annonces - Association VH Besançon',
  description: 'Découvrez les offres d&apos;emploi, stages et opportunités partagées par les membres',
}

interface Announcement {
  _id: string
  title: string
  slug: {
    current: string
  }
  type: string
  company?: string
  location?: string
  description: unknown[]
  contactEmail?: string
  externalLink?: string
  publishedAt: string
  expiresAt?: string
  author: {
    _id: string
    firstName: string
    lastName: string
    userType: string
    profileImage?: {
      asset: {
        _id: string
        url: string
      }
    }
  }
}

export default async function AnnouncementsPage() {
  // Vérifier l'authentification
  const session = await auth()

  if (!session) {
    redirect('/connexion?callbackUrl=/annonces')
  }

  // Récupérer toutes les annonces
  const announcements: Announcement[] = await client.fetch(announcementsQuery)

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Hero Section */}
        <HeroSection
          title="Forum des Annonces"
          subtitle="Découvrez les opportunités partagées par la communauté"
        />

        {/* Announcements Section */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <AnnouncementFilters announcements={announcements} />
        </section>
      </main>

      <Footer />
    </>
  )
}
