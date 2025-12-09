import { serverClient } from '@/sanity/lib/server-client'
import { sendAnnouncementNotificationEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

interface Announcement {
  _id: string
  title: string
  type: string
  company?: string
  location?: string
  slug: {
    _type?: string
    current: string
  }
}

/**
 * Notifie tous les abonnés aux annonces qu'une nouvelle annonce a été publiée
 */
export async function notifySubscribers(announcement: Announcement) {
  try {
    // Récupérer tous les abonnés qui ont activé les notifications d'annonces
    const subscriptions = await serverClient.fetch<
      Array<{
        _id: string
        user: {
          _id: string
          firstName: string
          lastName: string
          email: string
        }
      }>
    >(
      `*[_type == "newsletterSubscription" && announcementsNewsletter == true] {
        _id,
        user-> {
          _id,
          firstName,
          lastName,
          email
        }
      }`
    )

    if (!subscriptions || subscriptions.length === 0) {
      logger.info('Aucun abonné aux notifications d\'annonces')
      return { success: true, sent: 0 }
    }

    // Filtrer les abonnés qui ont un email valide
    const validSubscribers = subscriptions.filter(
      (sub) => sub.user && sub.user.email
    )

    logger.info(
      `Envoi de notifications à ${validSubscribers.length} abonné(s) pour l'annonce "${announcement.title}"`
    )

    // Envoyer les emails en parallèle
    const emailPromises = validSubscribers.map((subscription) => {
      const fullName = `${subscription.user.firstName} ${subscription.user.lastName}`
      return sendAnnouncementNotificationEmail(
        subscription.user.email,
        fullName,
        {
          title: announcement.title,
          type: announcement.type,
          company: announcement.company,
          location: announcement.location,
          slug: announcement.slug.current,
        }
      )
    })

    const results = await Promise.allSettled(emailPromises)

    // Compter les succès et échecs
    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    if (failed > 0) {
      logger.warn(
        `${failed} email(s) n'ont pas pu être envoyés sur ${validSubscribers.length}`
      )
    }

    logger.info(
      `Notifications envoyées : ${successful} succès, ${failed} échecs`
    )

    return {
      success: true,
      sent: successful,
      failed: failed,
      total: validSubscribers.length,
    }
  } catch (error) {
    logger.error(
      'Erreur lors de l\'envoi des notifications aux abonnés',
      error
    )
    // Ne pas faire échouer la création de l'annonce si les notifications échouent
    return { success: false, error }
  }
}
