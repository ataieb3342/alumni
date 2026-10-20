import { z } from 'zod'
import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { logActivity } from '@/lib/activity-logger'
import { setPreferences } from '@/lib/data/newsletter'
import { getUserById } from '@/lib/data/users'

const schema = z.object({
  preferences: z.object({ generalNewsletter: z.boolean(), announcementsNewsletter: z.boolean() }),
})

/** Abonnements d'un membre, modifiés par un administrateur (comme dans le Studio) */
export const POST = apiRoute({ auth: 'admin', body: schema }, async ({ params, body, user }) => {
  const member = await getUserById(params.id)
  if (!member) throw new HttpError(404, 'Compte introuvable')
  await setPreferences(member.id, body.preferences)
  await logActivity({ userId: user.id, action: 'admin.user.newsletter', resourceId: member.id, details: JSON.stringify(body.preferences) })
  return { success: true }
})
