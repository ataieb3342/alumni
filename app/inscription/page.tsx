'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PublicHeader from '../components/PublicHeader'
import Footer from '../components/Footer'
import OAuthButtons from '../components/OAuthButtons'
import Link from 'next/link'

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
        setError(data.error || 'Une erreur est survenue')
        return
      }

      // Afficher un message de succès
      router.push('/connexion?registered=true&pending=true')
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue lors de l\'inscription')
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
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    minLength={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                    placeholder="12 caractères min, avec majuscule, minuscule, chiffre et @$!%*?&"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                    minLength={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                    placeholder="Retapez le mot de passe"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
              >
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