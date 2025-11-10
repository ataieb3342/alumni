import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { serverClient } from '@/sanity/lib/server-client'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les données
    const data = await request.json()
    const { userId, preferences } = data

    // Validation
    if (!userId || !preferences) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur modifie ses propres préférences
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Vérifier si un document newsletterSubscription existe déjà
    const existingSubscription = await serverClient.fetch(
      `*[_type == "newsletterSubscription" && user._ref == $userId][0]`,
      { userId }
    )

    if (existingSubscription) {
      // Mettre à jour le document existant
      await serverClient
        .patch(existingSubscription._id)
        .set({
          generalNewsletter: preferences.generalNewsletter,
          announcementsNewsletter: preferences.announcementsNewsletter,
          updatedAt: new Date().toISOString(),
        })
        .commit()
    } else {
      // Créer un nouveau document
      await serverClient.create({
        _type: 'newsletterSubscription',
        user: {
          _type: 'reference',
          _ref: userId,
        },
        generalNewsletter: preferences.generalNewsletter,
        announcementsNewsletter: preferences.announcementsNewsletter,
        subscribedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Préférences mises à jour',
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
