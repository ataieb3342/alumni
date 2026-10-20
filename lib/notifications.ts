import { sendAnnouncementNotificationEmail } from '@/lib/email'
import { listAnnouncementSubscribers } from '@/lib/data/newsletter'
import { logger } from '@/lib/logger'

interface Announcement {
  title: string
  type: string
  company?: string | null
  location?: string | null
  slug: string
}

/**
 * Notifie tous les abonnés aux annonces qu'une nouvelle annonce a été publiée
 */
export async function notifySubscribers(announcement: Announcement) {
  try {
    const subscribers = (await listAnnouncementSubscribers()).filter((subscriber) => subscriber.email)

    if (subscribers.length === 0) {
      logger.info("Aucun abonné aux notifications d'annonces")
      return { success: true, sent: 0 }
    }

    logger.info(`Envoi de notifications à ${subscribers.length} abonné(s) pour l'annonce "${announcement.title}"`)

    const results = await Promise.allSettled(
      subscribers.map((subscriber) =>
        sendAnnouncementNotificationEmail(subscriber.email, `${subscriber.firstName} ${subscriber.lastName}`, {
          title: announcement.title,
          type: announcement.type,
          company: announcement.company ?? undefined,
          location: announcement.location ?? undefined,
          slug: announcement.slug,
        })
      )
    )

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed > 0) logger.warn(`${failed} email(s) n'ont pas pu être envoyés sur ${subscribers.length}`)
    logger.info(`Notifications envoyées : ${successful} succès, ${failed} échecs`)

    return { success: true, sent: successful, failed, total: subscribers.length }
  } catch (error) {
    logger.error("Erreur lors de l'envoi des notifications aux abonnés", error)
    // Ne pas faire échouer la création de l'annonce si les notifications échouent
    return { success: false, error }
  }
}
