import { apiRoute } from '@/lib/api'
import { adminSendAccessLink } from '@/lib/data/admin-users'

export const POST = apiRoute({ auth: 'admin', rateLimit: { maxRequests: 20, windowMs: 10 * 60_000 } }, async ({ params, user }) =>
  adminSendAccessLink(user, params.id)
)
