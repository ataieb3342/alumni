import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { client } from '@/sanity/lib/client'
import { testimonialsQuery } from '@/sanity/lib/queries'
import TestimonialFilters from '@/app/components/TestimonialFilters'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import HeroSection from '@/app/components/HeroSection'

export const metadata = {
  title: 'Témoignages - Association VH Besançon',
  description:
    'Découvrez les retours d\'expérience des alumni sur leurs études, parcours professionnels et vies à l\'international',
}

interface Author {
  _id: string
  firstName: string
  lastName: string
  userType: string
  promotionYear?: string
  profileImage?: {
    asset: {
      _id: string
      url: string
    }
  }
}

interface Testimonial {
  _id: string
  title: string
  slug: {
    current: string
  }
  type: string
  excerpt: string
  rating?: number
  likes?: number
  tags?: string[]
  publishedAt: string
  featuredImage?: {
    asset: {
      _id: string
      url: string
    }
  }
  author: Author
}

export default async function TestimonialsPage() {
  // Vérifier l'authentification
  const session = await auth()

  if (!session) {
    redirect('/connexion?callbackUrl=/temoignages')
  }

  // Récupérer tous les témoignages
  const testimonials: Testimonial[] = await client.fetch(testimonialsQuery)

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Hero Section */}
        <HeroSection
          title="Témoignages de la communauté"
          subtitle="Découvrez les parcours, expériences et conseils de nos alumni"
        />

        {/* Testimonials Section */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <TestimonialFilters testimonials={testimonials} />
        </section>
      </main>

      <Footer />
    </>
  )
}
