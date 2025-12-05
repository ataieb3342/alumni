'use client'

import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'

interface Author {
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
  author: Author
}

interface AnnouncementCardProps {
  announcement: Announcement
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

function getExcerpt(description: unknown[]): string {
  if (!description || description.length === 0) return ''

  const firstBlock = description[0] as { _type?: string; children?: { _type?: string; text?: string }[] }
  if (firstBlock._type === 'block' && firstBlock.children) {
    const text = firstBlock.children
      .filter((child) => child._type === 'span')
      .map((child) => child.text || '')
      .join(' ')
    return text.length > 150 ? text.substring(0, 150) + '...' : text
  }

  return ''
}

export default function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const typeInfo = typeLabels[announcement.type] || typeLabels.other
  const excerpt = getExcerpt(announcement.description)

  const authorInitials = `${announcement.author.firstName[0]}${announcement.author.lastName[0]}`

  let authorImage: string | null = null
  try {
    if (announcement.author.profileImage?.asset?.url) {
      authorImage = urlFor(announcement.author.profileImage.asset.url).width(40).height(40).url()
    }
  } catch (error) {
    authorImage = null
  }

  return (
    <Link
      href={`/annonces/${announcement.slug.current}`}
      className="group block h-full"
    >
      <article className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 h-full flex flex-col border border-white/20 hover:border-white/40 transform hover:-translate-y-1">
        <div className="p-6 flex-1 flex flex-col">
          {/* Header avec badge */}
          <div className="mb-4">
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
              <span>{typeInfo.icon}</span>
              <span>{typeInfo.label}</span>
            </span>
          </div>

          {/* Titre */}
          <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {announcement.title}
          </h3>

          {/* Entreprise et localisation */}
          {(announcement.company || announcement.location) && (
            <div className="space-y-2 mb-4">
              {announcement.company && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="font-medium">{announcement.company}</span>
                </div>
              )}
              {announcement.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {announcement.location}
                </div>
              )}
            </div>
          )}

          {/* Extrait */}
          {excerpt && (
            <p className="text-gray-600 mb-4 line-clamp-3 flex-1 text-sm leading-relaxed">
              {excerpt}
            </p>
          )}

          {/* Footer avec auteur */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {authorImage ? (
                  <Image
                    src={authorImage}
                    alt={`${announcement.author.firstName} ${announcement.author.lastName}`}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium ring-2 ring-white shadow-sm">
                    {authorInitials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium truncate">
                    {announcement.author.firstName} {announcement.author.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(announcement.publishedAt)}
                  </p>
                </div>
              </div>
              {/* Indicateur cliquable */}
              <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
