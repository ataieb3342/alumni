'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupProfileForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    userType: 'alumni' as 'current_student' | 'alumni' | 'staff',
    promotionYear: '',
    currentJob: '',
    company: '',
    bio: '',
    phone: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/profile/complete-oauth-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Une erreur est survenue')
        return
      }

      // Envoyer la notification à l'admin (en arrière-plan, ne pas bloquer)
      fetch('/api/auth/notify-admin-oauth', {
        method: 'POST',
      }).catch(err => console.error('Erreur envoi email admin:', err))

      // Rediriger vers la page de validation en attente
      // Le compte sera accessible après validation admin
      router.push('/validation-en-cours')
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue lors de la mise à jour du profil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type de membre *
        </label>
        <select
          value={formData.userType}
          onChange={(e) => setFormData({...formData, userType: e.target.value as 'current_student' | 'alumni' | 'staff'})}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900"
        >
          <option value="current_student" className="text-gray-900">Élève actuel</option>
          <option value="alumni" className="text-gray-900">Ancien élève</option>
          <option value="staff" className="text-gray-900">Personnel</option>
        </select>
      </div>

      {formData.userType !== 'staff' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Année de promotion
          </label>
          <input
            type="number"
            value={formData.promotionYear}
            onChange={(e) => setFormData({...formData, promotionYear: e.target.value})}
            placeholder="Ex: 2020"
            min="1950"
            max="2100"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
          />
        </div>
      )}

      {formData.userType !== 'current_student' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Poste actuel
            </label>
            <input
              type="text"
              value={formData.currentJob}
              onChange={(e) => setFormData({...formData, currentJob: e.target.value})}
              placeholder="Ex: Développeur Full-Stack"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entreprise
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
              placeholder="Ex: Google"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Téléphone
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          placeholder="Ex: +33 6 12 34 56 78"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Biographie
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({...formData, bio: e.target.value})}
          rows={4}
          placeholder="Parlez-nous de vous..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.push('/validation-en-cours')}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition"
        >
          Passer cette étape
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
