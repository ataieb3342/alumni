import { NextRequest, NextResponse } from 'next/server'
import { serverClient } from '@/sanity/lib/server-client'
import bcrypt from 'bcryptjs'
import { sendAdminNewUserNotification } from '@/lib/emails'
import { logger } from '@/lib/logger'
import { registerSchema } from '@/lib/validations'
import { rateLimit, RateLimitPresets } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = rateLimit(request, RateLimitPresets.auth)
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }
  try {
    const body = await request.json()

    // Valider les données avec Zod
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, password, userType } = validation.data

    // Vérifier si l'utilisateur existe déjà (peu importe le statut)
    const existingUser = await serverClient.fetch(
      `*[_type == "user" && email == $email][0]{
        _id,
        accountStatus
      }`,
      { email }
    )

    if (existingUser) {
      // Si un utilisateur existe avec cet email
      if (existingUser.accountStatus === 'pending') {
        return NextResponse.json(
          { error: 'Une demande d\'inscription avec cet email est déjà en cours de validation' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur dans Sanity avec statut "pending"
    const newUser = await serverClient.create({
      _type: 'user',
      firstName: firstName,
      lastName: lastName,
      email,
      password: hashedPassword,
      userType,
      accountStatus: 'pending', // L'utilisateur doit être validé par un admin
      isVisibleInDirectory: userType !== 'lyceen', // Les lycéens ne sont pas dans l'annuaire par défaut
      createdAt: new Date().toISOString(),
    })

    // Envoyer un email de notification aux admins
    try {
      await sendAdminNewUserNotification({
        firstName,
        lastName,
        email,
        userType,
        userId: newUser._id,
      })
    } catch (emailError) {
      logger.error('Erreur lors de l\'envoi de l\'email de notification admin', emailError)
      // On continue même si l'email échoue
    }

    return NextResponse.json(
      {
        message: 'Votre demande d\'inscription a été envoyée. Vous recevrez un email une fois votre compte validé par un administrateur.',
        userId: newUser._id
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Erreur lors de l\'inscription', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    )
  }
}