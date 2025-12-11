'use client'

import { useState } from 'react'
import { logger } from '@/lib/logger'
import { useRouter } from 'next/navigation'
import PublicHeader from '../components/PublicHeader'
import Footer from '../components/Footer'
import OAuthButtons from '../components/OAuthButtons'
import PasswordInput from '../components/PasswordInput'
import Link from 'next/link'
import { toast } from 'sonner'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'alumni' as 'lyceen' | 'bts' | 'prepa' | 'alumni' | 'staff',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (formData.password.length < 12) {
      setError('Le mot de passe doit contenir au moins 12 caractères')
      return
    }

    // Vérifier la complexité du mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    if (!passwordRegex.test(formData.password)) {
      setError('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || 'Une erreur est survenue'
        setError(errorMessage)
        toast.error(errorMessage)
        return
      }

      toast.success('Inscription réussie ! Votre compte est en attente de validation.')
      // Rediriger vers la page de validation en cours
      router.push('/validation-en-cours')
    } catch (err) {
      logger.error('Une erreur est survenue', err)
      const errorMessage = 'Une erreur est survenue lors de l\'inscription'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PublicHeader />
      
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">
              Inscription
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded border border-red-200">
                  {error}
                </div>
              )}
              
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de membre *
                </label>
                <select
                  value={formData.userType}
                  onChange={(e) => setFormData({...formData, userType: e.target.value as 'lyceen' | 'bts' | 'prepa' | 'alumni' | 'staff'})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900">
                  <option value="lyceen" className="text-gray-900">Lycéen</option>
                  <option value="bts" className="text-gray-900">BTS</option>
                  <option value="prepa" className="text-gray-900">Prépa</option>
                  <option value="alumni" className="text-gray-900">Ancien élève (Alumni)</option>
                  <option value="staff" className="text-gray-900">Personnel</option>
                </select>
              </div>
              
              <div>
                <PasswordInput
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  label="Mot de passe *"
                  placeholder="Entrez votre mot de passe"
                  required
                  minLength={12}
                />
                <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="font-medium text-blue-900 mb-1">Le mot de passe doit contenir :</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Au moins 12 caractères</li>
                    <li>Au moins une majuscule (A-Z)</li>
                    <li>Au moins une minuscule (a-z)</li>
                    <li>Au moins un chiffre (0-9)</li>
                    <li>Au moins un caractère spécial (@$!%*?&)</li>
                  </ul>
                </div>
              </div>

              <div>
                <PasswordInput
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  label="Confirmer le mot de passe *"
                  placeholder="Retapez le mot de passe"
                  required
                  minLength={12}
                />
              </div>
              
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
                {loading ? 'Inscription...' : 'S\'inscrire'}
              </button>
            </form>

            <div className="mt-6">
              <OAuthButtons mode="signup" callbackUrl="/validation-en-cours" />
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Déjà un compte ?{' '}
                <Link href="/connexion" className="text-blue-900 hover:underline font-semibold">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}