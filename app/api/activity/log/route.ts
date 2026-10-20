import { z } from 'zod'
import { apiRoute } from '@/lib/api'
import { getClientIp, getUserAgent, logActivity } from '@/lib/activity-logger'

// Seules les visites de pages sont journalisées depuis le navigateur
const schema = z.object({
  action: z.literal('page_visit'),
  resource: z.string().max(300).regex(/^\//, 'Chemin invalide'),
  details: z.string().max(400).optional(),
})

export const POST = apiRoute({ auth: 'user', body: schema, rateLimit: { maxRequests: 120, windowMs: 60_000 } }, async ({ req, body, user }) => {
  await logActivity({
    userId: user.id,
    action: body.action,
    resource: body.resource,
    details: body.details ?? `Visite de la page ${body.resource}`,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  })
  return { success: true }
})
