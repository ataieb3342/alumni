'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import PublicHeader from '../components/PublicHeader'
import Footer from '../components/Footer'

export default function ChooseTypePage() {
  const { data: session, status } = useSession()
  const [userType, setUserType] = useState<'lyceen' | 'bts' | 'prepa' | 'alumni' | 'staff'>('alumni')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const formSubmittedRef = useRef(false)
  const sessionRef = useRef(session)

  // Garder la ref de session à jour
  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    // Attendre que la session soit chargée avant de vérifier
    if (status === 'loading') return

    // Ne pas rediriger si le formulaire a été soumis avec succès (l'utilisateur va être redirigé vers /validation-en-cours)
    if (formSubmittedRef.current) return

    // Rediriger si l'utilisateur n'est pas connecté
    if (status === 'unauthenticated') {
      router.push('/connexion')
      return
    }

    // Si l'utilisateur est authentifié mais n'a pas besoin de sélectionner son type, rediriger vers le profil
    if (status === 'authenticated' && session?.user && !session.user.needsTypeSelection) {
      router.push('/profil')
    }
  }, [status, session, router])

  // Déconnecter l'utilisateur s'il quitte la page sans avoir choisi son type
  useEffect(() => {
    return () => {
      // Si le formulaire n'a pas été soumis, déconnecter pour nettoyer le token temporaire
      // On utilise sessionRef pour avoir la dernière valeur de session
      if (!formSubmittedRef.current && sessionRef.current?.user?.id?.startsWith('temp-')) {
        signOut({ redirect: false })
      }
    }
    // Pas de dépendances : le cleanup ne se déclenche que quand le composant se démonte vraiment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

      // Marquer le formulaire comme soumis avec succès pour éviter la déconnexion automatique
      formSubmittedRef.current = true

      // L'utilisateur a été créé dans Sanity avec succès
      // Vider la session et rediriger vers la page de validation

      // Attendre un peu que Sanity ait bien enregistré l'utilisateur
      await new Promise(resolve => setTimeout(resolve, 500))

      // Déconnecter l'utilisateur pour vider la session
      await signOut({ redirect: false })

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
