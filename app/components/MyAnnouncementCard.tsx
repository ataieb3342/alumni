'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Announcement {
  _id: string
  title: string
  slug: {
    current: string
  }
  type: string
  company?: string
  location?: string
  status: string
  publishedAt: string
  expiresAt?: string
}

interface MyAnnouncementCardProps {
  announcement: Announcement
}

const typeLabels: { [key: string]: { label: string; emoji: string; color: string } } = {
  job_offer: { label: 'Emploi', emoji: '💼', color: 'bg-blue-100 text-blue-800' },
  internship: { label: 'Stage', emoji: '🎓', color: 'bg-purple-100 text-purple-800' },
  opportunity: { label: 'Opportunité', emoji: '✨', color: 'bg-yellow-100 text-yellow-800' },
  event: { label: 'Événement', emoji: '📅', color: 'bg-green-100 text-green-800' },
  school_supplies: { label: 'Vente matos', emoji: '📚', color: 'bg-orange-100 text-orange-800' },
}

export default function MyAnnouncementCard({ announcement }: MyAnnouncementCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  const typeInfo = typeLabels[announcement.type] || { label: announcement.type, emoji: '📄', color: 'bg-gray-100 text-gray-800' }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/announcements/${announcement._id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      router.refresh()
      setShowDeleteConfirm(false)
    } catch (error) {
      alert('Une erreur est survenue lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const isExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date()

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 hover:shadow-md transition group">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${typeInfo.color}`}>
                <span>{typeInfo.emoji}</span>
                {typeInfo.label}
              </span>
              {announcement.status === 'draft' && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  Brouillon
                </span>
              )}
              {isExpired && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                  Expirée
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2 break-words">
              {announcement.title}
            </h3>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              {announcement.company && (
                <span>{announcement.company}</span>
              )}
              {announcement.location && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {announcement.location}
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Publié le {formatDate(announcement.publishedAt)}
            </p>
          </div>

          {/* Actions : toujours visibles sur mobile, au survol à partir de sm */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
            <Link
              href={`/annonces/${announcement.slug.current}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition text-sm"
              title="Voir l'annonce"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Voir
            </Link>
            <Link
              href={`/annonces/modifier/${announcement.slug.current}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition text-sm"
              title="Modifier l'annonce"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 bg-white hover:bg-red-50 text-red-600 border border-red-300 rounded-lg transition"
              title="Supprimer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Confirmer la suppression
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Cette action est irréversible
                </p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Êtes-vous sûr de vouloir supprimer l&apos;annonce <strong>&quot;{announcement.title}&quot;</strong> ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
