import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { announcementQuery } from '@/sanity/lib/queries'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import Link from 'next/link'
import EditAnnouncementForm from '@/app/components/EditAnnouncementForm'
import { PortableTextBlock } from '@portabletext/types'

export const metadata = {
  title: 'Modifier une annonce - Association VH Besançon',
  description: 'Modifiez votre annonce',
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
  description: PortableTextBlock[]
  contactEmail?: string
  contactPhone?: string
  externalLink?: string
  expiresAt?: string
  status: string
  author: {
    _id: string
  }
}

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // Vérifier l'authentification
  const session = await auth()

  if (!session?.user?.id) {
    const { slug } = await params
    redirect(`/connexion?callbackUrl=/annonces/modifier/${slug}`)
  }

  // Récupérer l'annonce
  const { slug } = await params
  const announcement: Announcement = await client.fetch(announcementQuery, { slug })

  if (!announcement) {
    redirect('/annonces/mes-annonces')
  }

  // Vérifier que l'utilisateur est l'auteur
  if (announcement.author._id !== session.user.id) {
    redirect('/annonces/mes-annonces')
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/annonces" className="hover:text-blue-600">
                Annonces
              </Link>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link href="/annonces/mes-annonces" className="hover:text-blue-600">
                Mes annonces
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
              Modifier l&apos;annonce
            </h1>
            <p className="text-gray-600">
              Modifiez les informations de votre annonce
            </p>
          </div>

          {/* Formulaire */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <EditAnnouncementForm announcement={announcement} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
