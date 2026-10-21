import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { getUserByEmail } from '@/lib/data/users'
import { issueToken } from '@/lib/data/tokens'
import { sendUserPasswordReset } from '@/lib/emails'
import { RateLimitPresets } from '@/lib/rate-limit'
import { forgotPasswordSchema } from '@/lib/validations'

const GENERIC = { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' }

/** Même réponse que le compte existe ou non (pas d'énumération) */
export const POST = apiRoute({ auth: 'public', body: forgotPasswordSchema, rateLimit: RateLimitPresets.email }, async ({ body }) => {
  const user = await getUserByEmail(body.email)
  if (!user) return GENERIC
  const token = await issueToken(user.email, 'reset')
  const result = await sendUserPasswordReset(user.email, token)
  if (!result.success) throw new HttpError(500, "Erreur lors de l'envoi de l'email")
  return GENERIC
})
