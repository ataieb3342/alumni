import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { hashPassword } from '@/lib/auth/password'
import { checkToken, consumeToken } from '@/lib/data/tokens'
import { getUserByEmail, setPasswordHash } from '@/lib/data/users'
import { RateLimitPresets } from '@/lib/rate-limit'
import { resetPasswordSchema } from '@/lib/validations'

export const POST = apiRoute({ auth: 'public', body: resetPasswordSchema, rateLimit: RateLimitPresets.sensitive }, async ({ body }) => {
  const check = await checkToken(body.token, 'reset')
  if (!check.ok) {
    throw new HttpError(400, check.reason === 'expired' ? 'Ce lien a expiré. Veuillez demander un nouveau lien.' : 'Lien invalide ou déjà utilisé')
  }
  const user = await getUserByEmail(check.email)
  if (!user) throw new HttpError(404, 'Utilisateur non trouvé')
  if (!(await consumeToken(check.id))) throw new HttpError(400, 'Lien invalide ou déjà utilisé')
  await setPasswordHash(user.id, await hashPassword(body.password))
  return { message: 'Mot de passe réinitialisé avec succès' }
})
