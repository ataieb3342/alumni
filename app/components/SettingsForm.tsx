'use client'

import { useState } from 'react'
import PasswordInput from './PasswordInput'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string
}

interface NewsletterPreferences {
  generalNewsletter: boolean
  announcementsNewsletter: boolean
}

interface SettingsFormProps {
  user: User
  initialPreferences: NewsletterPreferences
}

export default function SettingsForm({ user, initialPreferences }: SettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const [preferences, setPreferences] = useState<NewsletterPreferences>(initialPreferences)

  // États pour le changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handlePreferenceChange = (key: keyof NewsletterPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          preferences,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }

      const successMessage = 'Préférences mises à jour avec succès !'
      setMessage({
        type: 'success',
        text: successMessage,
      })
      toast.success(successMessage)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setMessage({
        type: 'error',
        text: errorMessage,
      })
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    // Validation
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'Les nouveaux mots de passe ne correspondent pas',
      })
      return
    }

    if (newPassword.length < 12) {
      setPasswordMessage({
        type: 'error',
        text: 'Le nouveau mot de passe doit contenir au moins 12 caractères',
      })
      return
    }

    // Vérifier la complexité du mot de passe
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/
    if (!passwordRegex.test(newPassword)) {
      setPasswordMessage({
        type: 'error',
        text: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)',
      })
      return
    }

    setPasswordLoading(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du changement de mot de passe')
      }

      const successMessage = 'Mot de passe modifié avec succès !'
      setPasswordMessage({
        type: 'success',
        text: successMessage,
      })
      toast.success(successMessage)

      // Réinitialiser les champs
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setPasswordMessage({
        type: 'error',
        text: errorMessage,
      })
      toast.error(errorMessage)
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-8">
        {message && (
          <div
            className={`px-4 py-3 rounded-xl ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {message.type === 'success' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Section Informations du compte */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
              Informations du compte
            </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet
              </label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-600">
                {user.name}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Pour modifier votre nom, utilisez la page &quot;Mon profil&quot;
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-600">
                {user.email}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Pour modifier votre email, contactez un administrateur
              </p>
            </div>
          </div>
        </div>

        {/* Section Sécurité - Changement de mot de passe */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
              Sécurité
            </h2>
          <p className="text-sm text-gray-600 mb-6">
            Modifiez votre mot de passe pour sécuriser votre compte
          </p>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordMessage && (
              <div
                className={`px-4 py-3 rounded-lg ${
                  passwordMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {passwordMessage.text}
              </div>
            )}

            <PasswordInput
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              label="Mot de passe actuel"
              required
            />

            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              label="Nouveau mot de passe"
              placeholder="12 caractères min, avec majuscule, minuscule, chiffre et @$!%*?&"
              required
              minLength={12}
            />

            <PasswordInput
              id="confirmNewPassword"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              label="Confirmer le nouveau mot de passe"
              placeholder="Retapez le nouveau mot de passe"
              required
              minLength={12}
            />

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {passwordLoading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {passwordLoading ? 'Modification en cours...' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>

        {/* Section Newsletters */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div id="newsletter" className="bg-white rounded-lg shadow-sm border p-6 scroll-mt-20">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Gestion des newsletters</h2>
            <p className="text-sm text-gray-600 mb-6">
              Choisissez les notifications que vous souhaitez recevoir
            </p>

            <div className="space-y-4">
              {/* Newsletter générale */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="generalNewsletter"
                  checked={preferences.generalNewsletter}
                  onChange={() => handlePreferenceChange('generalNewsletter')}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label htmlFor="generalNewsletter" className="block font-medium text-gray-900 cursor-pointer">
                    📧 Newsletter générale
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Recevez les actualités de l&apos;association, événements et informations importantes (envoi périodique)
                  </p>
                </div>
              </div>

              {/* Notifications annonces */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="announcementsNewsletter"
                  checked={preferences.announcementsNewsletter}
                  onChange={() => handlePreferenceChange('announcementsNewsletter')}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label htmlFor="announcementsNewsletter" className="block font-medium text-gray-900 cursor-pointer">
                    📢 Notifications des annonces
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Recevez un email automatique à chaque nouvelle annonce publiée sur le forum (emplois, stages, opportunités)
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting && (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </div>
        </form>

        {/* Section Danger Zone */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Zone de danger
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Actions irréversibles concernant votre compte
          </p>

          <div className="flex items-start justify-between p-4 bg-red-50 rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">
                Supprimer mon compte
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Cette action est définitive. Toutes vos données seront supprimées et vous ne pourrez plus accéder à votre compte.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="ml-4 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
            >
              Supprimer
            </button>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Conformité RGPD</p>
                <p className="mt-1">
                  Vous avez le droit de demander la suppression de toutes vos données personnelles conformément au RGPD.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Confirmer la suppression
              </h3>
            </div>

            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer votre compte? Cette action est <strong>définitive et irréversible</strong>. Toutes vos données seront perdues:
            </p>

            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>Votre profil dans l&apos;annuaire</li>
              <li>Vos annonces publiées</li>
              <li>Vos préférences newsletters</li>
              <li>Votre historique d&apos;activité</li>
            </ul>

            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-900 mb-2">
                Pour confirmer, tapez <span className="font-mono bg-red-100 px-2 py-1 rounded">SUPPRIMER</span>
              </p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Tapez SUPPRIMER"
                className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none font-mono text-gray-900 placeholder:text-gray-400"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmation('')
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirmation !== 'SUPPRIMER') {
                    return
                  }

                  setIsDeleting(true)
                  try {
                    const response = await fetch('/api/user/delete', {
                      method: 'DELETE',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ userId: user.id }),
                    })

                    if (!response.ok) {
                      throw new Error('Erreur lors de la suppression')
                    }

                    // Rediriger vers la page de déconnexion
                    window.location.href = '/api/auth/signout?callbackUrl=/'
                  } catch {
                    setMessage({
                      type: 'error',
                      text: 'Erreur lors de la suppression du compte',
                    })
                    setShowDeleteModal(false)
                    setDeleteConfirmation('')
                    setIsDeleting(false)
                  }
                }}
                disabled={deleteConfirmation !== 'SUPPRIMER' || isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
