import { NextRequest, NextResponse } from 'next/server'
import { serverClient } from '@/sanity/lib/server-client'
import bcrypt from 'bcryptjs'
import { logger } from '@/lib/logger'
import { resetPasswordSchema } from '@/lib/validations'
import { rateLimit, RateLimitPresets } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = rateLimit(request, RateLimitPresets.sensitive)
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }
  try {
    const body = await request.json()

    // Valider les données avec Zod
    const validation = resetPasswordSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { token, password } = validation.data

    // Récupérer le token
    const resetToken = await serverClient.fetch(
      `*[_type == "passwordResetToken" && token == $token && used == false][0]{
        _id,
        email,
        expiresAt,
        used
      }`,
      { token } as any
    )

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token invalide ou déjà utilisé' },
        { status: 400 }
      )
    }

    // Vérifier si le token a expiré
    const expiresAt = new Date(resetToken.expiresAt)
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Ce token a expiré. Veuillez demander un nouveau lien.' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur
    const user = await serverClient.fetch(
      `*[_type == "user" && email == $email][0]{
        _id,
        email
      }`,
      { email: resetToken.email } as any
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Mettre à jour le mot de passe de l'utilisateur
    await serverClient
      .patch(user._id)
      .set({ password: hashedPassword })
      .commit()

    // Marquer le token comme utilisé
    await serverClient
      .patch(resetToken._id)
      .set({ used: true })
      .commit()

    return NextResponse.json(
      { message: 'Mot de passe réinitialisé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Erreur lors de la réinitialisation:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
