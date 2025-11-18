import { NextResponse } from 'next/server'
import { serverClient } from '@/sanity/lib/server-client'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      userId,
      firstName,
      lastName,
      promotionYear,
      currentStudies,
      linkedIn,
      bio,
      isVisibleInDirectory,
      education,
      experience,
      profileImageAssetId,
      deleteProfileImage,
      coverImageAssetId,
      deleteCoverImage
    } = body

    // Vérifier que l'utilisateur modifie bien son propre profil
    const user = await serverClient.fetch(
      `*[_type == "user" && _id == $userId && email == $email][0]`,
      { userId, email: session.user.email }
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé ou non autorisé' },
        { status: 403 }
      )
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {
      firstName,
      lastName,
      promotionYear: promotionYear && promotionYear !== '' ? (typeof promotionYear === 'number' ? promotionYear : parseInt(promotionYear, 10)) : undefined,
      currentStudies,
      linkedIn,
      bio,
      isVisibleInDirectory,
    }

    // Ajouter les formations et expériences si fournies (uniquement pour alumni et staff)
    if (education !== undefined) {
      updateData.education = education
    }
    if (experience !== undefined) {
      updateData.experience = experience
    }

    // Ajouter l'image de profil si fournie
    if (profileImageAssetId) {
      updateData.profileImage = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: profileImageAssetId,
        },
      }
    }

    // Ajouter l'image de couverture si fournie
    if (coverImageAssetId) {
      updateData.coverImage = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: coverImageAssetId,
        },
      }
    }

    // Construire la requête de patch
    let patchQuery = serverClient.patch(userId).set(updateData)

    // Si l'utilisateur veut supprimer l'image de profil
    if (deleteProfileImage && !profileImageAssetId) {
      patchQuery = patchQuery.unset(['profileImage'])
    }

    // Si l'utilisateur veut supprimer l'image de couverture
    if (deleteCoverImage && !coverImageAssetId) {
      patchQuery = patchQuery.unset(['coverImage'])
    }

    // Mettre à jour l'utilisateur
    await patchQuery.commit()

    return NextResponse.json(
      { message: 'Profil mis à jour avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}