import { z } from 'zod'
import { apiRoute } from '@/lib/api'
import { setPreferences } from '@/lib/data/newsletter'

const schema = z.object({
  /** Ignoré : toujours le membre connecté */
  userId: z.string().optional(),
  preferences: z.object({ generalNewsletter: z.boolean(), announcementsNewsletter: z.boolean() }),
})

export const POST = apiRoute({ auth: 'user', body: schema }, async ({ body, user }) => {
  await setPreferences(user.id, body.preferences)
  return { success: true, message: 'Préférences mises à jour' }
})
