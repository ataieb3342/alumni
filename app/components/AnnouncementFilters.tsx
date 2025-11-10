'use client'

import { useState } from 'react'
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

  const filteredAnnouncements = selectedFilter
    ? announcements.filter((announcement) => announcement.type === selectedFilter)
    : announcements

  return (
    <>
      {/* Filtres et Actions */}
      <div className="mb-8 space-y-4">
        {/* Actions en haut sur mobile, intégrées sur desktop */}
        <div className="lg:hidden flex gap-3 w-full">
          <Link
            href="/annonces/mes-annonces"
            className="flex-1 px-5 py-3 rounded-xl font-medium text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-white border border-gray-200 shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Mes annonces
          </Link>
          <Link
            href="/annonces/nouvelle"
            className="flex-1 px-5 py-3 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Publier
          </Link>
        </div>

        {/* Barre de filtres */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Filtres */}
            <div className="flex flex-wrap gap-3">
              {filterButtons.map((button) => (
                <button
                  key={button.id}
                  onClick={() => setSelectedFilter(button.type)}
                  className={`px-5 py-3 rounded-xl font-medium transition-all duration-200 ${
                    selectedFilter === button.type
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white/60 text-gray-700 hover:bg-white/80 border border-gray-200'
                  }`}
                >
                  {button.label}
                </button>
              ))}
            </div>

            {/* Actions desktop seulement */}
            <div className="hidden lg:flex gap-3 flex-shrink-0">
              <Link
                href="/annonces/mes-annonces"
                className="px-5 py-3 rounded-xl font-medium text-gray-700 bg-white/60 hover:bg-white/80 border border-gray-200 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Mes annonces
              </Link>
              <Link
                href="/annonces/nouvelle"
                className="px-5 py-3 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Publier
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des annonces */}
      {filteredAnnouncements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAnnouncements.map((announcement) => (
            <AnnouncementCard key={announcement._id} announcement={announcement} />
          ))}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-white/20">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {selectedFilter ? 'Aucune annonce de ce type' : 'Aucune annonce pour le moment'}
            </h3>
            {selectedFilter && (
              <p className="text-gray-600">
                Essayez un autre filtre ou consultez toutes les annonces.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
