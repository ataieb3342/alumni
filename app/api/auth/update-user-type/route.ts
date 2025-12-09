import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { serverClient } from '@/sanity/lib/server-client'
import { sendAdminNewUserNotification } from '@/lib/emails'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const updateTypeSchema = z.object({
  userType: z.enum(['lyceen', 'bts', 'prepa', 'alumni', 'staff'], { message: 'Type d\'utilisateur invalide' }),
})

export async function POST(request: Request) {
  try {
    const session = await auth()

    // Vérifier que l'utilisateur est connecté
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Valider les données avec Zod
    const validation = updateTypeSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { userType } = validation.data

    // Vérifier si c'est une nouvelle inscription OAuth (ID temporaire)
    if (session.user.id.startsWith('temp-')) {
      // C'est une nouvelle inscription OAuth, créer l'utilisateur dans Sanity
      const email = session.user.email?.toLowerCase()

      if (!email) {
        return NextResponse.json(
          { error: 'Email manquant' },
          { status: 400 }
        )
      }

      // Vérifier si l'utilisateur existe déjà avec cet email
      const existingUser = await serverClient.fetch(
        `*[_type == "user" && email == $email][0]{ _id }`,
        { email }
      )

      if (existingUser) {
        return NextResponse.json(
          { error: 'Un utilisateur avec cet email existe déjà' },
          { status: 400 }
        )
      }

      // Créer le nouvel utilisateur dans Sanity
      const newUser = await serverClient.create({
        _type: 'user',
        firstName: session.user.firstName || '',
        lastName: session.user.lastName || '',
        email,
        oauthProvider: session.user.provider,
        oauthId: session.user.id.replace('temp-', ''),
        userType,
        accountStatus: 'pending',
        isVisibleInDirectory: userType !== 'lyceen',
        createdAt: new Date().toISOString(),
        // Ajouter les données spécifiques au provider
        ...(session.user.provider === 'linkedin' && session.user.linkedInUrl ? {
          linkedIn: session.user.linkedInUrl
        } : {}),
      })

      // Envoyer l'email admin
      try {
        await sendAdminNewUserNotification({
          firstName: session.user.firstName || '',
          lastName: session.user.lastName || '',
          email,
          userType,
          userId: newUser._id,
        })
      } catch (emailError) {
        logger.error('Erreur lors de l\'envoi de l\'email admin:', emailError)
      }

      return NextResponse.json(
        {
          message: 'Utilisateur créé avec succès',
          userType,
          userId: newUser._id,
        },
        { status: 200 }
      )
    }

    // Sinon, c'est une mise à jour classique d'un utilisateur existant
    const user = await serverClient.fetch(
      `*[_type == "user" && _id == $userId][0]{
        _id,
        firstName,
        lastName,
        email,
        userType,
        accountStatus
      }`,
      { userId: session.user.id }
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour le type d'utilisateur
    await serverClient
      .patch(user._id)
      .set({
        userType,
        isVisibleInDirectory: userType !== 'lyceen',
      })
      .commit()

    return NextResponse.json(
      {
        message: 'Type d\'utilisateur mis à jour avec succès',
        userType,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du type:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}
