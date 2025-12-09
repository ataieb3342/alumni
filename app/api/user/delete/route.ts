import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { auth } from '@/lib/auth'
import { serverClient } from '@/sanity/lib/server-client'

export async function DELETE(request: NextRequest) {
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
    const { userId } = data

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur manquant' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur supprime son propre compte
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Suppression complète en cascade de toutes les données de l'utilisateur
    logger.debug(`Début de la suppression en cascade pour l'utilisateur ${userId}`)

    // 1. Supprimer les annonces de l'utilisateur
    const userAnnouncements = await serverClient.fetch(
      `*[_type == "announcement" && author._ref == $userId]._id`,
      { userId }
    )

    logger.debug(`Suppression de ${userAnnouncements.length} annonce(s)`)
    for (const announcementId of userAnnouncements) {
      await serverClient.delete(announcementId)
    }

    // 2. Supprimer les préférences newsletter
    const newsletterSub = await serverClient.fetch(
      `*[_type == "newsletterSubscription" && user._ref == $userId][0]._id`,
      { userId }
    )

    if (newsletterSub) {
      logger.debug('Suppression des préférences newsletter')
      await serverClient.delete(newsletterSub)
    }

    // 3. Supprimer le compte utilisateur
    logger.debug('Suppression du compte utilisateur')
    await serverClient.delete(userId)

    return NextResponse.json({
      success: true,
      message: 'Compte supprimé avec succès',
    })
  } catch (error) {
    logger.error('Erreur lors de la suppression du compte:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression' },
      { status: 500 }
    )
  }
}
