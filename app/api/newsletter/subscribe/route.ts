import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { serverClient } from '@/sanity/lib/server-client'
import { auth } from '@/lib/auth'
import { rateLimit, RateLimitPresets } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = rateLimit(request, RateLimitPresets.general)
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { generalNewsletter, announcementsNewsletter } = body

    // Vérifier si un abonnement existe déjà
    const existingSubscription = await serverClient.fetch(
      `*[_type == "newsletterSubscription" && user._ref == $userId][0]`,
      { userId: session.user.id }
    )

    if (existingSubscription) {
      // Mettre à jour l'abonnement existant
      await serverClient
        .patch(existingSubscription._id)
        .set({
          generalNewsletter: generalNewsletter ?? existingSubscription.generalNewsletter,
          announcementsNewsletter: announcementsNewsletter ?? existingSubscription.announcementsNewsletter,
          updatedAt: new Date().toISOString(),
        })
        .commit()

      return NextResponse.json({
        message: 'Préférences mises à jour',
        subscription: existingSubscription,
      })
    } else {
      // Créer un nouvel abonnement
      const newSubscription = await serverClient.create({
        _type: 'newsletterSubscription',
        user: {
          _type: 'reference',
          _ref: session.user.id,
        },
        generalNewsletter: generalNewsletter ?? false,
        announcementsNewsletter: announcementsNewsletter ?? false,
        subscribedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      return NextResponse.json({
        message: 'Abonnement créé',
        subscription: newSubscription,
      }, { status: 201 })
    }
  } catch (error) {
    logger.error('Erreur lors de l\'abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'abonnement' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer l'abonnement actuel
    const subscription = await serverClient.fetch(
      `*[_type == "newsletterSubscription" && user._ref == $userId][0]`,
      { userId: session.user.id }
    )

    if (!subscription) {
      return NextResponse.json({
        generalNewsletter: false,
        announcementsNewsletter: false,
      })
    }

    return NextResponse.json(subscription)
  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'abonnement:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}
