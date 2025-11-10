'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AnnouncementFormProps {
  userId: string
}

export default function AnnouncementForm({ userId }: AnnouncementFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    type: 'job_offer',
    company: '',
    location: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    externalLink: '',
    expiresAt: '',
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
      const response = await fetch('/api/announcements/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la création de l\'annonce')
      }

      const { slug } = await response.json()
      router.push(`/annonces/${slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Informations de base */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de base</h2>
        <div className="space-y-6">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900"
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
          <div className="grid md:grid-cols-2 gap-6">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                placeholder="Ex: Paris, Remote, Besançon"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Décrivez votre annonce en détail <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={10}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
            placeholder="Décrivez votre annonce en détail : missions, profil recherché, conditions, etc."
          />
          <p className="mt-1 text-sm text-gray-500">
            Soyez précis et détaillé pour attirer les bonnes personnes
          </p>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de contact</h2>
        <div className="space-y-4">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              placeholder="https://exemple.com/candidature"
            />
          </div>
        </div>
      </div>

      {/* Date d'expiration */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Validité de l&apos;annonce</h2>
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900"
          />
          <p className="mt-1 text-sm text-gray-500">
            Après cette date, l&apos;annonce ne sera plus visible
          </p>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-end gap-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition disabled:opacity-50"
        >
          {isSubmitting ? 'Publication...' : 'Publier l\'annonce'}
        </button>
      </div>
    </form>
  )
}
