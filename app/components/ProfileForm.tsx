'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import ImageCropModal from './ImageCropModal'

interface Education {
  school: string
  degree: string
  field?: string
  startYear: number | ''
  endYear?: number | ''
  description?: string
}

interface Experience {
  company: string
  position: string
  location?: string
  startDate: string
  endDate?: string
  current?: boolean
  description?: string
}

interface ProfileFormProps {
  userData: {
    _id: string
    firstName: string
    lastName: string
    email: string
    userType: string
    promotionYear?: number
    currentStudies?: string
    linkedIn?: string
    bio?: string
    isVisibleInDirectory?: boolean
    education?: Education[]
    experience?: Experience[]
    profileImage?: {
      asset: {
        _ref: string
        url?: string
      }
    }
    coverImage?: {
      asset: {
        _ref: string
        url?: string
      }
    }
  }
}

export default function ProfileForm({ userData }: ProfileFormProps) {
  const [formData, setFormData] = useState<{
    firstName: string
    lastName: string
    promotionYear: number | ''
    currentStudies: string
    linkedIn: string
    bio: string
    isVisibleInDirectory: boolean
  }>({
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    promotionYear: userData.promotionYear ?? '',
    currentStudies: userData.currentStudies || '',
    linkedIn: userData.linkedIn || '',
    bio: userData.bio || '',
    isVisibleInDirectory: userData.isVisibleInDirectory ?? true,
  })
  const [education, setEducation] = useState<Education[]>(userData.education || [])
  const [experience, setExperience] = useState<Experience[]>(userData.experience || [])
  const [editingEducationIndex, setEditingEducationIndex] = useState<number | null>(null)
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<number | null>(null)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [imageDeleted, setImageDeleted] = useState(false)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImageDeleted, setCoverImageDeleted] = useState(false)

  // États pour le modal de recadrage
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [coverImageToCrop, setCoverImageToCrop] = useState<string | null>(null)
  const [cropModalType, setCropModalType] = useState<'profile' | 'cover' | null>(null)

  // Utiliser urlFor pour l'image existante de Sanity, ou null
  const existingImageUrl = userData.profileImage
    ? urlFor(userData.profileImage).width(400).height(400).fit('crop').crop('center').url()
    : null

  const existingCoverImageUrl = userData.coverImage
    ? urlFor(userData.coverImage).width(1200).height(400).fit('crop').crop('center').url()
    : null

  const [imagePreview, setImagePreview] = useState<string | null>(existingImageUrl)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(existingCoverImageUrl)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Effacer les messages précédents
      setMessage(null)

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Veuillez sélectionner une image valide (JPG, PNG, WEBP)' })
        return
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'L\'image ne doit pas dépasser 5 MB' })
        return
      }

      // Créer une URL temporaire pour le recadrage
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageToCrop(reader.result as string)
        setCropModalType('profile')
      }
      reader.readAsDataURL(file)
    }
    // Réinitialiser l'input pour permettre de sélectionner la même image plusieurs fois
    e.target.value = ''
  }

  const removeImage = () => {
    setProfileImage(null)
    setImagePreview(null)
    setImageDeleted(true) // Marquer que l'image a été supprimée
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Effacer les messages précédents
      setMessage(null)

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Veuillez sélectionner une image valide (JPG, PNG, WEBP)' })
        return
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'L\'image ne doit pas dépasser 5 MB' })
        return
      }

      // Créer une URL temporaire pour le recadrage
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImageToCrop(reader.result as string)
        setCropModalType('cover')
      }
      reader.readAsDataURL(file)
    }
    // Réinitialiser l'input pour permettre de sélectionner la même image plusieurs fois
    e.target.value = ''
  }

  const removeCoverImage = () => {
    setCoverImage(null)
    setCoverImagePreview(null)
    setCoverImageDeleted(true)
  }

  // Gestion du recadrage de la photo de profil
  const handleProfileCropComplete = (croppedImage: Blob) => {
    // Convertir le Blob en File
    const file = new File([croppedImage], 'profile-image.jpg', { type: 'image/jpeg' })
    setProfileImage(file)
    setImageDeleted(false)

    // Créer une prévisualisation
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Fermer le modal
    setImageToCrop(null)
    setCropModalType(null)
  }

  // Gestion du recadrage de la photo de couverture
  const handleCoverCropComplete = (croppedImage: Blob) => {
    // Convertir le Blob en File
    const file = new File([croppedImage], 'cover-image.jpg', { type: 'image/jpeg' })
    setCoverImage(file)
    setCoverImageDeleted(false)

    // Créer une prévisualisation
    const reader = new FileReader()
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Fermer le modal
    setCoverImageToCrop(null)
    setCropModalType(null)
  }

  // Annuler le recadrage
  const handleCropCancel = () => {
    setImageToCrop(null)
    setCoverImageToCrop(null)
    setCropModalType(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      let imageAssetId = null
      let coverImageAssetId = null

      // Si une nouvelle image de profil a été sélectionnée, l'uploader d'abord
      if (profileImage) {
        const imageFormData = new FormData()
        imageFormData.append('file', profileImage)

        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          body: imageFormData,
        })

        const uploadData = await uploadResponse.json()

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Erreur lors de l\'upload de l\'image de profil')
        }

        imageAssetId = uploadData.assetId
      }

      // Si une nouvelle image de couverture a été sélectionnée, l'uploader
      if (coverImage) {
        const coverFormData = new FormData()
        coverFormData.append('file', coverImage)

        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          body: coverFormData,
        })

        const uploadData = await uploadResponse.json()

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Erreur lors de l\'upload de l\'image de couverture')
        }

        coverImageAssetId = uploadData.assetId
      }

      // Préparer les données à envoyer
      const updatePayload: Record<string, unknown> = {
        userId: userData._id,
        ...formData,
        education,
        experience,
      }

      // Ajouter la nouvelle image de profil si elle existe
      if (imageAssetId) {
        updatePayload.profileImageAssetId = imageAssetId
      }

      // Ajouter la nouvelle image de couverture si elle existe
      if (coverImageAssetId) {
        updatePayload.coverImageAssetId = coverImageAssetId
      }

      // Indiquer si l'image de profil doit être supprimée
      if (imageDeleted && !profileImage) {
        updatePayload.deleteProfileImage = true
      }

      // Indiquer si l'image de couverture doit être supprimée
      if (coverImageDeleted && !coverImage) {
        updatePayload.deleteCoverImage = true
      }

      // Ensuite, mettre à jour le profil
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Erreur lors de la mise à jour')
      }

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' })
      setProfileImage(null) // Réinitialiser le fichier après l'upload réussi
      setImageDeleted(false) // Réinitialiser le flag de suppression
      setCoverImage(null) // Réinitialiser le fichier de couverture
      setCoverImageDeleted(false) // Réinitialiser le flag de suppression de couverture

      // Remonter en haut de la page pour voir le message de succès
      window.scrollTo({ top: 0, behavior: 'smooth' })

      router.refresh()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil' })
      // Remonter en haut de la page pour voir le message d'erreur
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  const isLyceen = userData.userType === 'lyceen'
  const canEditFullProfile = userData.userType === 'alumni' || userData.userType === 'staff'
  const canEditEducation = userData.userType !== 'lyceen'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Type d'utilisateur */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Type de profil</h2>
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {userData.userType === 'lyceen' && '🎓'}
            {userData.userType === 'bts' && '📚'}
            {userData.userType === 'prepa' && '📖'}
            {userData.userType === 'alumni' && '🎓'}
            {userData.userType === 'staff' && '👨‍🏫'}
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {userData.userType === 'lyceen' && 'Lycéen'}
              {userData.userType === 'bts' && 'BTS'}
              {userData.userType === 'prepa' && 'Prépa'}
              {userData.userType === 'alumni' && 'Ancien élève (Alumni)'}
              {userData.userType === 'staff' && 'Personnel'}
            </div>
            <div className="text-sm text-gray-600">
              {isLyceen && 'Profil simplifié : nom, prénom et email uniquement'}
              {!isLyceen && 'Accès complet à toutes les fonctionnalités du profil'}
            </div>
          </div>
        </div>
      </div>

      {/* Photo de profil */}
      {!isLyceen && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo de profil</h2>
        <div>
          <div className="flex items-start gap-6">
          {/* Prévisualisation de l'image */}
          <div className="flex-shrink-0">
            {imagePreview ? (
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-200 shadow-lg">
                <Image
                  src={imagePreview}
                  alt="Photo de profil"
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center border-4 border-blue-200 shadow-lg">
                <div className="text-4xl font-bold text-white">
                  {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                </div>
              </div>
            )}
          </div>

          {/* Contrôles d'upload */}
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-3">
              Formats acceptés : JPG, PNG, WEBP • Taille max : 5 MB • Recommandé : 400x400px
            </p>
            <div className="flex gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {imagePreview ? 'Changer la photo' : 'Ajouter une photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {imagePreview && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
        </div>
      )}

      {/* Photo de couverture */}
      {!isLyceen && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo de couverture</h2>
        <div className="space-y-4">
          {/* Prévisualisation de l'image de couverture */}
          <div>
            {coverImagePreview ? (
              <div className="w-full h-48 rounded-xl overflow-hidden border-4 border-blue-200 shadow-lg relative group">
                <Image
                  src={coverImagePreview}
                  alt="Photo de couverture"
                  width={1200}
                  height={400}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={removeCoverImage}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-48 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center border-4 border-blue-200 shadow-lg">
                <div className="text-center text-white">
                  <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm opacity-75">Aucune photo de couverture</p>
                </div>
              </div>
            )}
          </div>

          {/* Contrôles d'upload */}
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Formats acceptés : JPG, PNG, WEBP • Taille max : 5 MB • Recommandé : 1200x400px
            </p>
            <div className="flex gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {coverImagePreview ? 'Changer la photo de couverture' : 'Ajouter une photo de couverture'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverImageChange}
                  className="hidden"
                />
              </label>

              {coverImagePreview && (
                <button
                  type="button"
                  onClick={removeCoverImage}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Informations de base */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de base</h2>
        <div className="space-y-6">
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

          {canEditEducation && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {userData.userType === 'alumni' ? 'Année du baccalauréat' : 'Année du baccalauréat (prévue)'}
                </label>
                <input
                  type="number"
                  value={formData.promotionYear === '' ? '' : formData.promotionYear}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData({...formData, promotionYear: value === '' ? '' : parseInt(value, 10)})
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                  placeholder="2025"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {userData.userType === 'alumni'
                    ? 'L\'année où vous avez obtenu votre baccalauréat'
                    : 'L\'année prévue d\'obtention de votre baccalauréat'
                  }
                </p>
              </div>

              {canEditFullProfile && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="text"
                    value={formData.linkedIn}
                    onChange={(e) => setFormData({...formData, linkedIn: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                    placeholder="https://linkedin.com/in/votre-nom"
                  />
                </div>
              )}

              {!canEditFullProfile && userData.userType !== 'alumni' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classe/Formation actuelle
                  </label>
                  <input
                    type="text"
                    value={formData.currentStudies}
                    onChange={(e) => setFormData({...formData, currentStudies: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                    placeholder={
                      userData.userType === 'bts' ? 'BTS SIO, BTS MCO...' :
                      userData.userType === 'prepa' ? 'MPSI, PCSI, ECG...' :
                      'Votre classe actuelle'
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Votre classe ou formation actuelle
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email (non modifiable)
          </label>
          <input
            type="email"
            value={userData.email}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
          />
        </div>
      </div>


      {/* Biographie */}
      {!isLyceen && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Biographie</h2>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parlez de vous
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
            placeholder="Parlez de vous, votre parcours, vos intérêts..."
          />
        </div>
      )}

      {/* Formations (uniquement pour alumni et staff) */}
      {canEditFullProfile && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Formations</h2>

          {/* Message d'information pour le Lycée Victor Hugo */}
          {education.length === 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Ajoutez votre parcours au Lycée Victor Hugo
                  </p>
                  <p className="text-sm text-blue-700">
                    Nous vous recommandons d&apos;ajouter en première formation votre parcours au Lycée Victor Hugo avec les spécialités/options suivies. Cela permettra aux lycéens actuels de mieux identifier les parcours possibles.
                  </p>
                </div>
              </div>
            </div>
          )}

          {education.length > 0 && !education.some(edu =>
            edu.school?.toLowerCase().includes('victor hugo') ||
            edu.school?.toLowerCase().includes('vh') ||
            edu.school?.toLowerCase().includes('lycée victor hugo')
          ) && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 mb-1">
                    N&apos;oubliez pas votre parcours au Lycée Victor Hugo
                  </p>
                  <p className="text-sm text-amber-700">
                    Pensez à ajouter votre formation au Lycée Victor Hugo avec vos spécialités/options. Cela aide les lycéens à s&apos;inspirer de votre parcours.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {education.map((edu, index) => (
              <div key={index}>
                {editingEducationIndex === index ? (
                  // Mode édition
                  <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Diplôme *
                        </label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => {
                            const newEducation = [...education]
                            newEducation[index].degree = e.target.value
                            setEducation(newEducation)
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                          placeholder="Master en Informatique"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          École/Université *
                        </label>
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => {
                            const newEducation = [...education]
                            newEducation[index].school = e.target.value
                            setEducation(newEducation)
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                          placeholder="Université Paris-Saclay"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Domaine d&apos;études
                        </label>
                        <input
                          type="text"
                          value={edu.field || ''}
                          onChange={(e) => {
                            const newEducation = [...education]
                            newEducation[index].field = e.target.value
                            setEducation(newEducation)
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                          placeholder="Informatique"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Année début *
                          </label>
                          <input
                            type="number"
                            value={edu.startYear === '' ? '' : edu.startYear}
                            onChange={(e) => {
                              const newEducation = [...education]
                              const value = e.target.value
                              newEducation[index].startYear = value === '' ? '' : parseInt(value, 10)
                              setEducation(newEducation)
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                            placeholder="2020"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Année fin
                          </label>
                          <input
                            type="number"
                            value={edu.endYear === '' ? '' : (edu.endYear || '')}
                            onChange={(e) => {
                              const newEducation = [...education]
                              const value = e.target.value
                              newEducation[index].endYear = value === '' ? '' : parseInt(value, 10)
                              setEducation(newEducation)
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                            placeholder="2022"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={edu.description || ''}
                          onChange={(e) => {
                            const newEducation = [...education]
                            newEducation[index].description = e.target.value
                            setEducation(newEducation)
                          }}
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                          placeholder="Spécialisation, mention, projets importants..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setEditingEducationIndex(null)}
                        className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition"
                      >
                        Terminer
                      </button>
                      <button
                        type="button"
                        onClick={() => setEducation(education.filter((_, i) => i !== index))}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  // Mode prévisualisation
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{edu.degree || 'Diplôme non renseigné'}</h3>
                        <p className="text-blue-900 font-semibold">{edu.school || 'École non renseignée'}</p>
                        {edu.field && (
                          <p className="text-sm text-gray-600">{edu.field}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                          {edu.startYear || '?'} - {edu.endYear || 'En cours'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingEducationIndex(index)}
                          className="opacity-0 group-hover:opacity-100 transition px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Modifier
                        </button>
                      </div>
                    </div>
                    {edu.description && (
                      <p className="text-gray-700 text-sm mt-2 leading-relaxed">
                        {edu.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                setEducation([...education, { school: '', degree: '', startYear: '' }])
                setEditingEducationIndex(education.length)
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-900 hover:text-blue-900 transition font-medium"
            >
              + Ajouter une formation
            </button>
          </div>
        </div>
      )}

      {/* Expériences professionnelles (uniquement pour alumni et staff) */}
      {canEditFullProfile && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expériences professionnelles</h2>
          <div className="space-y-4">
            {experience.map((exp, index) => (
              <div key={index}>
                {editingExperienceIndex === index ? (
                  // Mode édition
                  <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Poste *
                        </label>
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => {
                            const newExperience = [...experience]
                            newExperience[index].position = e.target.value
                            setExperience(newExperience)
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                          placeholder="Développeur Full Stack"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Entreprise *
                        </label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const newExperience = [...experience]
                            newExperience[index].company = e.target.value
                            setExperience(newExperience)
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                          placeholder="Nom de l'entreprise"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lieu
                        </label>
                        <input
                          type="text"
                          value={exp.location || ''}
                          onChange={(e) => {
                            const newExperience = [...experience]
                            newExperience[index].location = e.target.value
                            setExperience(newExperience)
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                          placeholder="Paris, France"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date début *
                          </label>
                          <input
                            type="date"
                            value={exp.startDate}
                            onChange={(e) => {
                              const newExperience = [...experience]
                              newExperience[index].startDate = e.target.value
                              setExperience(newExperience)
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date fin
                          </label>
                          <input
                            type="date"
                            value={exp.endDate || ''}
                            onChange={(e) => {
                              const newExperience = [...experience]
                              newExperience[index].endDate = e.target.value
                              setExperience(newExperience)
                            }}
                            disabled={exp.current}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 disabled:bg-gray-200 text-gray-900"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={exp.current || false}
                            onChange={(e) => {
                              const newExperience = [...experience]
                              // Si on coche cette expérience comme actuelle, décocher toutes les autres
                              if (e.target.checked) {
                                newExperience.forEach((exp, i) => {
                                  if (i !== index) {
                                    exp.current = false
                                  }
                                })
                                newExperience[index].current = true
                                newExperience[index].endDate = undefined
                              } else {
                                newExperience[index].current = false
                              }
                              setExperience(newExperience)
                            }}
                            className="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-900"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            C&apos;est mon poste actuel
                          </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1 ml-6">
                          Une seule expérience peut être marquée comme poste actuel. Elle sera utilisée pour l&apos;annuaire.
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={exp.description || ''}
                          onChange={(e) => {
                            const newExperience = [...experience]
                            newExperience[index].description = e.target.value
                            setExperience(newExperience)
                          }}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                          placeholder="Responsabilités, réalisations, technologies utilisées..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setEditingExperienceIndex(null)}
                        className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition"
                      >
                        Terminer
                      </button>
                      <button
                        type="button"
                        onClick={() => setExperience(experience.filter((_, i) => i !== index))}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  // Mode prévisualisation
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{exp.position || 'Poste non renseigné'}</h3>
                        <p className="text-blue-900 font-semibold">{exp.company || 'Entreprise non renseignée'}</p>
                        {exp.location && (
                          <p className="text-sm text-gray-600">📍 {exp.location}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-sm text-gray-600 font-medium whitespace-nowrap block">
                            {exp.startDate ? new Date(exp.startDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '?'}
                            {' - '}
                            {exp.current ? 'Présent' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '?'}
                          </span>
                          {exp.current && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              Actuel
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingExperienceIndex(index)}
                          className="opacity-0 group-hover:opacity-100 transition px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Modifier
                        </button>
                      </div>
                    </div>
                    {exp.description && (
                      <p className="text-gray-700 text-sm mt-2 leading-relaxed whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                setExperience([...experience, { company: '', position: '', startDate: '' }])
                setEditingExperienceIndex(experience.length)
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-900 hover:text-blue-900 transition font-medium"
            >
              + Ajouter une expérience professionnelle
            </button>
          </div>
        </div>
      )}

      {/* Visibilité dans l'annuaire */}
      {!isLyceen && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Visibilité</h2>
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="isVisible"
                checked={formData.isVisibleInDirectory}
                onChange={(e) => setFormData({...formData, isVisibleInDirectory: e.target.checked})}
                className="mt-1 w-5 h-5 text-blue-900 border-gray-300 rounded focus:ring-blue-900"
              />
              <div className="flex-1">
                <label htmlFor="isVisible" className="block font-medium text-gray-900 cursor-pointer mb-1">
                  Apparaître dans l&apos;annuaire public
                </label>
                <p className="text-sm text-gray-600">
                  Si activé, votre profil sera visible par tous les membres dans l&apos;annuaire
                </p>
              </div>
            </div>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex justify-end gap-4 pt-6">
        <button
          type="button"
          onClick={() => router.push('/accueil')}
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

      {/* Modal de recadrage pour la photo de profil */}
      {cropModalType === 'profile' && imageToCrop && (
        <ImageCropModal
          image={imageToCrop}
          onComplete={handleProfileCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          title="Recadrer la photo de profil"
        />
      )}

      {/* Modal de recadrage pour la photo de couverture */}
      {cropModalType === 'cover' && coverImageToCrop && (
        <ImageCropModal
          image={coverImageToCrop}
          onComplete={handleCoverCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={3}
          title="Recadrer la photo de couverture"
        />
      )}
    </form>
  )
}