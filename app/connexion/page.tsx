// app/connexion/page.tsx
'use client'

import { signIn } from 'next-auth/react'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PublicHeader from '../components/PublicHeader'
import Footer from '../components/Footer'
import OAuthButtons from '../components/OAuthButtons'
import PasswordInput from '../components/PasswordInput'
import Link from 'next/link'
import { toast } from 'sonner'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const registered = searchParams.get('registered')
    const pending = searchParams.get('pending')
    const message = searchParams.get('message')

    if (registered === 'true' && pending === 'true') {
      setSuccessMessage('Votre demande d\'inscription a été envoyée avec succès. Vous recevrez un email une fois votre compte validé par un administrateur.')
    }

    // Si l'utilisateur vient de créer son compte via OAuth, le reconnecter automatiquement
    if (message === 'account-created') {
      const provider = searchParams.get('provider')
      if (provider && (provider === 'google' || provider === 'linkedin')) {
        // Afficher le message de validation en attente
        setSuccessMessage('Votre demande d\'inscription a été envoyée avec succès. Vous recevrez un email une fois votre compte validé par un administrateur. Reconnexion en cours...')
        // Attendre un peu avant de déclencher la reconnexion (2s pour laisser le temps de lire le message)
        setTimeout(() => {
          signIn(provider, { callbackUrl: '/validation-en-cours' })
        }, 2000)
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('') // Clear success message on submit
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // Vérifier si l'utilisateur existe mais n'est pas validé
        const checkUser = await fetch('/api/user/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const userData = await checkUser.json()

        if (userData.accountStatus === 'pending') {
          const errorMessage = 'Votre compte est en attente de validation par un administrateur. Vous recevrez un email une fois votre compte validé.'
          setError(errorMessage)
          toast.error(errorMessage)
        } else {
          const errorMessage = 'Email ou mot de passe incorrect'
          setError(errorMessage)
          toast.error(errorMessage)
        }
      } else {
        toast.success('Connexion réussie !')
        router.push('/accueil')
        router.refresh()
      }
    } catch {
      const errorMessage = 'Une erreur est survenue'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Connexion
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {successMessage && (
              <div className="bg-green-50 text-green-700 p-3 rounded border border-green-200">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="votre.email@exemple.fr"
              />
            </div>

            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="Mot de passe"
              required
              labelExtra={
                <Link href="/mot-de-passe-oublie" className="text-sm text-blue-900 hover:underline">
                  Mot de passe oublié ?
                </Link>
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6">
            <OAuthButtons mode="signin" callbackUrl="/accueil" />
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Pas encore de compte ?{' '}
              <Link href="/inscription" className="text-blue-900 hover:underline font-semibold">
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <>
      <PublicHeader />
      <Suspense fallback={
        <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-xl p-8">
              <div className="text-center">Chargement...</div>
            </div>
          </div>
        </main>
      }>
        <LoginForm />
      </Suspense>
      <Footer />
    </>
  )
}