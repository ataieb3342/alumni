import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { serverClient } from '@/sanity/lib/server-client'
import { auth } from '@/lib/auth'
import { updateProfileSchema } from '@/lib/validations'

// Pas de node:crypto ici : son import fait échouer les tests sur la machine
// de build Vercel. Une clé Sanity doit seulement être unique dans son tableau.
function withKeys<T extends { _key?: string }>(items: T[]) {
  return items.map((item) => ({ ...item, _key: item._key ?? Math.random().toString(36).slice(2, 14) }))
}

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

    // Valider les données avec Zod
    const validation = updateProfileSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      )
    }

    const {
      userId,
      firstName,
      lastName,
      promotionYear,
      currentStudies,
      linkedIn,
      bio,
      city,
      subjects,
      isVisibleInDirectory,
      staffCategory,
      staffDetails,
      education,
      experience,
      profileImageAssetId,
      deleteProfileImage,
      coverImageAssetId,
      deleteCoverImage
    } = validation.data

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
      promotionYear, // Déjà validé et transformé par Zod
      currentStudies,
      linkedIn,
      bio,
      city,
      subjects,
      isVisibleInDirectory,
      staffCategory,
      staffDetails,
    }

    // Ajouter les formations et expériences si fournies (uniquement pour alumni et staff).
    // Sanity exige une _key par élément de tableau ; les éléments ajoutés depuis
    // le formulaire n'en ont pas encore.
    if (education !== undefined) {
      updateData.education = withKeys(education)
    }
    if (experience !== undefined) {
      updateData.experience = withKeys(experience)
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
    logger.error('Erreur lors de la mise à jour du profil:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}