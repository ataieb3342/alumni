'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import AnnouncementCard from './AnnouncementCard'

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

interface AnnouncementFiltersProps {
  announcements: Announcement[]
}

const filterButtons = [
  { id: 'all', label: 'Toutes', type: null },
  { id: 'job_offer', label: '💼 Emplois', type: 'job_offer' },
  { id: 'internship', label: '🎓 Stages', type: 'internship' },
  { id: 'opportunity', label: '✨ Opportunités', type: 'opportunity' },
  { id: 'event', label: '📅 Événements', type: 'event' },
  { id: 'school_supplies', label: '📚 Vente matos', type: 'school_supplies' },
]

export default function AnnouncementFilters({ announcements }: AnnouncementFiltersProps) {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredAndSortedAnnouncements = useMemo(() => {
    let filtered = announcements

    // Filtrer par type
    if (selectedFilter) {
      filtered = filtered.filter((announcement) => announcement.type === selectedFilter)
    }

    // Filtrer par recherche (titre, entreprise, localisation, auteur)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((announcement) => {
        const titleMatch = announcement.title.toLowerCase().includes(query)
        const companyMatch = announcement.company?.toLowerCase().includes(query)
        const locationMatch = announcement.location?.toLowerCase().includes(query)
        const authorMatch =
          `${announcement.author.firstName} ${announcement.author.lastName}`.toLowerCase().includes(query)
        return titleMatch || companyMatch || locationMatch || authorMatch
      })
    }

    // Toujours trier par récence
    return [...filtered].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
  }, [announcements, selectedFilter, searchQuery])

  return (
    <div className="space-y-6">
      {/* Recherche, Filtres et Actions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-5">
        {/* Barre de recherche et actions */}
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Rechercher par titre, entreprise, localisation, auteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-11 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-gray-700 text-sm"
            />
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Link
              href="/annonces/mes-annonces"
              className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Mes annonces
            </Link>
            <Link
              href="/annonces/nouvelle"
              className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Publier
            </Link>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((button) => (
            <button
              key={button.id}
              onClick={() => setSelectedFilter(button.type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedFilter === button.type
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des annonces */}
      {filteredAndSortedAnnouncements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 [&>*]:min-w-0">
          {filteredAndSortedAnnouncements.map((announcement) => (
            <AnnouncementCard key={announcement._id} announcement={announcement} />
          ))}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-white/20">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Aucune annonce trouvée
            </h3>
            <p className="text-gray-600 mb-6">
              Essayez de modifier vos critères de recherche ou de filtres
            </p>
            <button
              onClick={() => {
                setSelectedFilter(null)
                setSearchQuery('')
              }}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
