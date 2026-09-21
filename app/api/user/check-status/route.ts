import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { rateLimit, RateLimitPresets } from '@/lib/rate-limit'
import { serverClient } from '@/sanity/lib/server-client'

export async function POST(request: NextRequest) {
  // Route publique qui révèle l'existence d'un compte : sans limite, elle permet
  // d'énumérer les emails membres.
  const rateLimitResult = rateLimit(request, RateLimitPresets.auth)
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    // Normaliser l'email en minuscules pour la comparaison
    const normalizedEmail = email.toLowerCase()

    // Récupérer le statut du compte
    const user = await serverClient.fetch(
      `*[_type == "user" && email == $email][0]{
        accountStatus
      }`,
      { email: normalizedEmail }
    )

    if (!user) {
      return NextResponse.json({ accountStatus: null })
    }

    return NextResponse.json({ accountStatus: user.accountStatus })
  } catch (error) {
    logger.error('Erreur lors de la vérification du statut:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    )
  }
}
