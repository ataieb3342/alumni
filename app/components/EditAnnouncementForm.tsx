'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PortableTextBlock } from '@portabletext/types'

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
}

interface EditAnnouncementFormProps {
  announcement: Announcement
}

interface PortableTextChild {
  text?: string
  _type: string
}

// Fonction pour extraire le texte du PortableText
const extractTextFromPortableText = (blocks: PortableTextBlock[]): string => {
  return blocks
    .map((block) => {
      if (block._type === 'block' && block.children) {
        return block.children
          .map((child: PortableTextChild) => child.text || '')
          .join('')
      }
      return ''
    })
    .join('\n\n')
}

export default function EditAnnouncementForm({ announcement }: EditAnnouncementFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: announcement.title,
    type: announcement.type,
    company: announcement.company || '',
    location: announcement.location || '',
    description: extractTextFromPortableText(announcement.description),
    contactEmail: announcement.contactEmail || '',
    contactPhone: announcement.contactPhone || '',
    externalLink: announcement.externalLink || '',
    expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().split('T')[0] : '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/announcements/${announcement._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          company: formData.company || null,
          location: formData.location || null,
          description: [
            {
              _type: 'block',
              style: 'normal',
              children: [
                {
                  _type: 'span',
                  text: formData.description,
                },
              ],
            },
          ],
          contactEmail: formData.contactEmail || null,
          contactPhone: formData.contactPhone || null,
          externalLink: formData.externalLink || null,
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la mise à jour de l\'annonce')
      }

      router.push('/annonces/mes-annonces')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Titre */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Titre de l&apos;annonce <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          maxLength={100}
          value={formData.title}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
          placeholder="Ex: Développeur Full Stack - CDI"
        />
        <p className="mt-1 text-sm text-gray-500">{formData.title.length}/100 caractères</p>
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
          Type d&apos;annonce <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          name="type"
          required
          value={formData.type}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        >
          <option value="job_offer" className="text-gray-900">💼 Offre d&apos;emploi</option>
          <option value="internship" className="text-gray-900">🎓 Stage</option>
          <option value="opportunity" className="text-gray-900">✨ Opportunité</option>
          <option value="event" className="text-gray-900">📅 Événement</option>
          <option value="school_supplies" className="text-gray-900">📚 Vente matos scolaire</option>
          <option value="other" className="text-gray-900">📢 Autre</option>
        </select>
      </div>

      {/* Entreprise et Localisation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
            Entreprise / Organisation
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            placeholder="Ex: Nom de l'entreprise"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Localisation
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            placeholder="Ex: Paris, Remote, Besançon"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={10}
          value={formData.description}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
          placeholder="Décrivez votre annonce en détail : missions, profil recherché, conditions, etc."
        />
        <p className="mt-1 text-sm text-gray-500">
          Soyez précis et détaillé pour attirer les bonnes personnes
        </p>
      </div>

      {/* Contact */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Informations de contact
        </h3>

        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Email de contact
          </label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            placeholder="contact@exemple.com"
          />
        </div>

        <div>
          <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone de contact
          </label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            placeholder="06 12 34 56 78"
          />
        </div>

        <div>
          <label htmlFor="externalLink" className="block text-sm font-medium text-gray-700 mb-2">
            Lien externe (candidature, plus d&apos;infos)
          </label>
          <input
            type="url"
            id="externalLink"
            name="externalLink"
            value={formData.externalLink}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            placeholder="https://exemple.com/candidature"
          />
        </div>
      </div>

      {/* Date d'expiration */}
      <div>
        <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-2">
          Date d&apos;expiration (optionnel)
        </label>
        <input
          type="date"
          id="expiresAt"
          name="expiresAt"
          value={formData.expiresAt}
          onChange={handleChange}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
        <p className="mt-1 text-sm text-gray-500">
          Après cette date, l&apos;annonce ne sera plus visible
        </p>
      </div>

      {/* Boutons */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Enregistrement en cours...' : 'Enregistrer les modifications'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/annonces/mes-annonces')}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
