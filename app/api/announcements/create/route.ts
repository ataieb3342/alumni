import { apiRoute } from '@/lib/api'
import { createAnnouncement } from '@/lib/data/announcements'
import { notifySubscribers } from '@/lib/notifications'
import { logger } from '@/lib/logger'
import { RateLimitPresets } from '@/lib/rate-limit'
import { createAnnouncementSchema } from '@/lib/validations'

export const POST = apiRoute({ auth: 'user', body: createAnnouncementSchema, rateLimit: RateLimitPresets.contentCreation }, async ({ body, user }) => {
  const announcement = await createAnnouncement(user.id, {
    title: body.title,
    type: body.type,
    company: body.company || null,
    location: body.location || null,
    description: body.description,
    contactEmail: body.contactEmail || null,
    contactPhone: body.contactPhone || null,
    externalLink: body.externalLink || null,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    eventDate: body.type === 'event' && body.eventDate ? new Date(body.eventDate) : null,
  })
  // Notification des abonnés sans retarder la réponse
  notifySubscribers(announcement).catch((error) => logger.error('Erreur lors de la notification des abonnés', error))
  return { success: true, announcementId: announcement.id, slug: announcement.slug }
})
