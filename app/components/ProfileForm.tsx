'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProfileFormProps {
  userData: {
    _id: string
    firstName: string
    lastName: string
    email: string
    userType: string
    phone?: string
    promotionYear?: number
    currentStudies?: string
    currentJob?: string
    company?: string
    linkedIn?: string
    bio?: string
    isVisibleInDirectory?: boolean
  }
}

export default function ProfileForm({ userData }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    phone: userData.phone || '',
    promotionYear: userData.promotionYear || '',
    currentStudies: userData.currentStudies || '',
    currentJob: userData.currentJob || '',
    company: userData.company || '',
    linkedIn: userData.linkedIn || '',
    bio: userData.bio || '',
    isVisibleInDirectory: userData.isVisibleInDirectory ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData._id,
          ...formData,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' })
      router.refresh()
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du profil' })
    } finally {
      setLoading(false)
    }
  }

  const isStudent = userData.userType === 'current_student'
  const isAlumniOrStaff = userData.userType === 'alumni' || userData.userType === 'staff'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`p-4 rounded ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Informations de base */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Informations de base</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prénom *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Contact</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (non modifiable)
            </label>
            <input
              type="email"
              value={userData.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
              placeholder="+33 6 12 34 56 78"
            />
          </div>
        </div>
      </div>

      {/* Parcours */}
      {!isAlumniOrStaff && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Parcours</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Année de promotion
              </label>
              <input
                type="number"
                value={formData.promotionYear}
                onChange={(e) => setFormData({...formData, promotionYear: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                placeholder="2024"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Études actuelles
              </label>
              <input
                type="text"
                value={formData.currentStudies}
                onChange={(e) => setFormData({...formData, currentStudies: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                placeholder="École/Université"
              />
            </div>
          </div>
        </div>
      )}

      {/* Professionnel (Alumni et Staff) */}
      {isAlumniOrStaff && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Informations professionnelles</h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année de promotion
                </label>
                <input
                  type="number"
                  value={formData.promotionYear}
                  onChange={(e) => setFormData({...formData, promotionYear: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                  placeholder="2010"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poste actuel
                </label>
                <input
                  type="text"
                  value={formData.currentJob}
                  onChange={(e) => setFormData({...formData, currentJob: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                  placeholder="Développeur Full Stack"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entreprise
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                  placeholder="Nom de l'entreprise"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={formData.linkedIn}
                  onChange={(e) => setFormData({...formData, linkedIn: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Biographie */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Biographie
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({...formData, bio: e.target.value})}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
          placeholder="Parlez de vous, votre parcours, vos intérêts..."
        />
      </div>

      {/* Visibilité dans l'annuaire */}
      {isAlumniOrStaff && (
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isVisible"
            checked={formData.isVisibleInDirectory}
            onChange={(e) => setFormData({...formData, isVisibleInDirectory: e.target.checked})}
            className="w-5 h-5 text-blue-900 border-gray-300 rounded focus:ring-blue-900"
          />
          <label htmlFor="isVisible" className="text-sm font-medium text-gray-700">
            Apparaître dans l&apos;annuaire public
          </label>
        </div>
      )}

      {/* Boutons */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}