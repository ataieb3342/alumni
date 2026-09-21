// app/api/auth/check-credentials/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { serverClient } from '@/sanity/lib/server-client'
import { rateLimit, RateLimitPresets } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import bcrypt from 'bcryptjs'

// Message unique pour « compte inexistant » et « mot de passe incorrect ».
// Les distinguer transformerait cette route en oracle d'énumération de comptes.
const INVALID_CREDENTIALS = {
  valid: false,
  error: 'Email ou mot de passe incorrect',
  errorType: 'invalid_credentials',
} as const

export async function POST(request: NextRequest) {
  // Rate limiting : cette route contourne celui de NextAuth et déclenche un
  // bcrypt.compare à chaque appel (coût CPU).
  const rateLimitResult = rateLimit(request, RateLimitPresets.auth)
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Normaliser l'email en minuscules
    const normalizedEmail = email.toLowerCase()

    // Récupérer l'utilisateur depuis Sanity
    const user = await serverClient.fetch(
      `*[_type == "user" && email == $email][0]{
        _id,
        email,
        password,
        accountStatus
      }`,
      { email: normalizedEmail }
    )

    // Si l'utilisateur n'existe pas
    if (!user) {
      return NextResponse.json(INVALID_CREDENTIALS, { status: 200 })
    }

    // Si l'utilisateur n'a pas de mot de passe (compte OAuth uniquement)
    if (!user.password) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Ce compte utilise une connexion Google ou LinkedIn. Veuillez utiliser le bouton de connexion correspondant.',
          errorType: 'oauth_account'
        },
        { status: 200 }
      )
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(INVALID_CREDENTIALS, { status: 200 })
    }

    // Vérifier le statut du compte
    // (mot de passe déjà validé ici : aucune fuite d'information)
    if (user.accountStatus !== 'active') {
      return NextResponse.json(
        {
          valid: false,
          error: 'Votre compte est en attente de validation par un administrateur. Vous recevrez un email une fois votre compte validé.',
          errorType: 'pending_validation',
          accountStatus: user.accountStatus
        },
        { status: 200 }
      )
    }

    // Tout est bon
    return NextResponse.json(
      {
        valid: true,
        message: 'Credentials valides'
      },
      { status: 200 }
    )

  } catch (error) {
    logger.error('Erreur lors de la vérification des credentials:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la vérification' },
      { status: 500 }
    )
  }
}
