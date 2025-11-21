'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import PublicHeader from '../components/PublicHeader'
import Footer from '../components/Footer'

export default function ChooseTypePage() {
  const { data: session, status, update } = useSession()
  const [userType, setUserType] = useState<'lyceen' | 'bts' | 'prepa' | 'alumni' | 'staff'>('alumni')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Attendre que la session soit chargée avant de vérifier
    if (status === 'loading') return

    // Rediriger si l'utilisateur n'est pas connecté
    if (status === 'unauthenticated') {
      router.push('/connexion')
      return
    }

    // Si l'utilisateur est authentifié mais n'est pas nouveau, rediriger vers le profil
    if (status === 'authenticated' && session?.user && !session.user.isNewUser) {
      router.push('/profil')
    }
  }, [status, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Mettre à jour le type d'utilisateur
      const response = await fetch('/api/auth/update-user-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      // Mettre à jour la session pour marquer l'utilisateur comme non-nouveau
      await update()

      // Rediriger vers la page de validation en cours
      router.push('/validation-en-cours')
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <>
        <PublicHeader />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <PublicHeader />

      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Complétez votre profil
              </h1>
              <p className="text-gray-600">
                Sélectionnez votre type de membre pour finaliser votre inscription
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Vous êtes : *
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-900 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="userType"
                      value="lyceen"
                      checked={userType === 'lyceen'}
                      onChange={(e) => setUserType(e.target.value as typeof userType)}
                      className="w-4 h-4 text-blue-900 focus:ring-blue-900"
                    />
                    <div className="ml-3">
                      <div className="font-semibold text-gray-900">Lycéen</div>
                      <div className="text-sm text-gray-500">Élève actuellement au lycée</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-900 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="userType"
                      value="bts"
                      checked={userType === 'bts'}
                      onChange={(e) => setUserType(e.target.value as typeof userType)}
                      className="w-4 h-4 text-blue-900 focus:ring-blue-900"
                    />
                    <div className="ml-3">
                      <div className="font-semibold text-gray-900">BTS</div>
                      <div className="text-sm text-gray-500">Étudiant en BTS</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-900 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="userType"
                      value="prepa"
                      checked={userType === 'prepa'}
                      onChange={(e) => setUserType(e.target.value as typeof userType)}
                      className="w-4 h-4 text-blue-900 focus:ring-blue-900"
                    />
                    <div className="ml-3">
                      <div className="font-semibold text-gray-900">Prépa</div>
                      <div className="text-sm text-gray-500">Étudiant en classe préparatoire</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-900 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="userType"
                      value="alumni"
                      checked={userType === 'alumni'}
                      onChange={(e) => setUserType(e.target.value as typeof userType)}
                      className="w-4 h-4 text-blue-900 focus:ring-blue-900"
                    />
                    <div className="ml-3">
                      <div className="font-semibold text-gray-900">Ancien élève (Alumni)</div>
                      <div className="text-sm text-gray-500">Ancien élève du lycée</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-900 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="userType"
                      value="staff"
                      checked={userType === 'staff'}
                      onChange={(e) => setUserType(e.target.value as typeof userType)}
                      className="w-4 h-4 text-blue-900 focus:ring-blue-900"
                    />
                    <div className="ml-3">
                      <div className="font-semibold text-gray-900">Personnel</div>
                      <div className="text-sm text-gray-500">Personnel du lycée</div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Validation...' : 'Continuer'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
