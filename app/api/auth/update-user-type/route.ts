import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { serverClient } from '@/sanity/lib/server-client'
import { sendAdminNotificationEmail } from '@/lib/email'
import { z } from 'zod'

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

    // Récupérer l'utilisateur depuis Sanity
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
        isVisibleInDirectory: userType !== 'lyceen', // Les lycéens ne sont pas dans l'annuaire par défaut
      })
      .commit()

    // Envoyer un email de notification aux admins
    try {
      await sendAdminNotificationEmail({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType,
        userId: user._id,
      })
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email admin:', emailError)
      // On continue même si l'email échoue
    }

    return NextResponse.json(
      {
        message: 'Type d\'utilisateur mis à jour avec succès',
        userType,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la mise à jour du type:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}
