import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { redirect, notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { announcementQuery } from '@/sanity/lib/queries'
import { PortableText } from '@portabletext/react'
import { getImageProps } from '@/sanity/lib/image'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'

interface Author {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  userType: string
  linkedIn?: string
  experience?: Array<{
    company: string
    position: string
    location?: string
    startDate: string
    endDate?: string
    current?: boolean
    description?: string
  }>
  profileImage?: {
    asset: {
      _id: string
      url: string
    }
  }
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
  description: never[]
  contactEmail?: string
  contactPhone?: string
  externalLink?: string
  publishedAt: string
  expiresAt?: string
  status: string
  author: Author
}

const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
  job_offer: { label: 'Offre d\'emploi', icon: '💼', color: 'bg-blue-100 text-blue-800' },
  internship: { label: 'Stage', icon: '🎓', color: 'bg-purple-100 text-purple-800' },
  opportunity: { label: 'Opportunité', icon: '✨', color: 'bg-yellow-100 text-yellow-800' },
  event: { label: 'Événement', icon: '📅', color: 'bg-green-100 text-green-800' },
  other: { label: 'Autre', icon: '📢', color: 'bg-gray-100 text-gray-800' },
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // Await params (Next.js 15)
  const { slug } = await params

  // Vérifier l'authentification
  const session = await auth()

  if (!session) {
    redirect('/connexion?callbackUrl=/annonces/' + slug)
  }

  // Récupérer l&apos;annonce
  const announcement: Announcement = await client.fetch(announcementQuery, {
    slug,
  })

  if (!announcement) {
    notFound()
  }

  const typeInfo = typeLabels[announcement.type] || typeLabels.other
  const authorInitials = `${announcement.author.firstName[0]}${announcement.author.lastName[0]}`

  let authorImageProps = null
  try {
    if (announcement.author.profileImage?.asset?.url) {
      authorImageProps = getImageProps(announcement.author.profileImage.asset.url, 80, 80)
    }
  } catch (error) {
    logger.error('Error generating author image URL:', error)
    authorImageProps = null
  }

  // Extraire les infos du poste actuel de l'auteur
  const currentExperience = announcement.author.experience?.find(exp => exp.current)
  const authorCurrentJob = currentExperience?.position
  const authorCompany = currentExperience?.company

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/annonces" className="hover:text-blue-600">
            Annonces
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium truncate">{announcement.title}</span>
        </nav>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                <span>{typeInfo.icon}</span>
                <span>{typeInfo.label}</span>
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(announcement.publishedAt)}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              {announcement.title}
            </h1>

            {(announcement.company || announcement.location) && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                {announcement.company && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {announcement.company}
                  </span>
                )}
                {announcement.location && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {announcement.location}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="px-8 py-6 border-t border-gray-100">
            <div className="prose prose-blue max-w-none prose-sm">
              <PortableText value={announcement.description} />
            </div>
          </div>

          {/* Contact et actions */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-wrap gap-3 mb-6">
              {announcement.contactEmail && (
                <a
                  href={`mailto:${announcement.contactEmail}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </a>
              )}

              {announcement.contactPhone && (
                <a
                  href={`tel:${announcement.contactPhone}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Téléphone
                </a>
              )}

              {announcement.externalLink && (
                <a
                  href={announcement.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  En savoir plus
                </a>
              )}
            </div>

            {/* Auteur */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
                {authorImageProps ? (
                  <Image
                    {...authorImageProps}
                    alt={`${announcement.author.firstName} ${announcement.author.lastName}`}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {authorInitials}
                  </div>
                )}
                <div className="flex-1">
                  <Link
                    href={`/annuaire/${announcement.author._id}`}
                    className="text-sm font-semibold text-gray-900 hover:text-blue-600"
                  >
                    {announcement.author.firstName} {announcement.author.lastName}
                  </Link>
                  {(authorCurrentJob || authorCompany) && (
                    <p className="text-xs text-gray-600">
                      {authorCurrentJob}
                      {authorCurrentJob && authorCompany && ' · '}
                      {authorCompany}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton retour */}
        <div className="mt-6">
          <Link
            href="/annonces"
            className="group inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </Link>
        </div>
      </div>
    </main>
    <Footer />
    </>
  )
}
