import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { testimonialQuery } from '@/sanity/lib/queries'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import Link from 'next/link'
import EditTestimonialForm from '@/app/components/EditTestimonialForm'

export const metadata = {
  title: 'Modifier un témoignage - Association VH Besançon',
  description: 'Modifiez votre témoignage',
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
  tags?: string[]
  status: string
  author: {
    _id: string
  }
}

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // Vérifier l'authentification
  const session = await auth()

  if (!session?.user?.id) {
    const { slug } = await params
    redirect(`/connexion?callbackUrl=/temoignages/modifier/${slug}`)
  }

  // Récupérer le témoignage
  const { slug } = await params
  const testimonial: Testimonial = await client.fetch(testimonialQuery, { slug })

  if (!testimonial) {
    redirect('/temoignages/mes-temoignages')
  }

  // Vérifier que l'utilisateur est l'auteur
  if (testimonial.author._id !== session.user.id) {
    redirect('/temoignages/mes-temoignages')
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/temoignages" className="hover:text-blue-600">
                Témoignages
              </Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link href="/temoignages/mes-temoignages" className="hover:text-blue-600">
                Mes témoignages
              </Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900">Modifier</span>
            </nav>
          </div>
        </div>

        {/* Contenu */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Modifier le témoignage
            </h1>
            <p className="text-gray-600">
              Modifiez les informations de votre témoignage
            </p>
          </div>

          {/* Formulaire */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <EditTestimonialForm testimonial={testimonial} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
