import { z } from 'zod'
import { apiRoute } from '@/lib/api'
import { getPreferences, setPreferences } from '@/lib/data/newsletter'
import { RateLimitPresets } from '@/lib/rate-limit'

const schema = z.object({ generalNewsletter: z.boolean().optional(), announcementsNewsletter: z.boolean().optional() })

export const GET = apiRoute({ auth: 'user' }, async ({ user }) => getPreferences(user.id))

export const POST = apiRoute({ auth: 'user', body: schema, rateLimit: RateLimitPresets.general }, async ({ body, user }) => ({
  message: 'Préférences mises à jour',
  subscription: await setPreferences(user.id, body),
}))
