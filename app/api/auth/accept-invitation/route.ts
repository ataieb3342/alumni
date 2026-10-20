import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { hashPassword } from '@/lib/auth/password'
import { checkToken, consumeToken } from '@/lib/data/tokens'
import { getUserByEmail, setPasswordHash } from '@/lib/data/users'
import { RateLimitPresets } from '@/lib/rate-limit'
import { resetPasswordSchema } from '@/lib/validations'

/** Invitation (comptes repris du Studio Sanity, comptes créés par un admin) : choix du mot de passe */
export const POST = apiRoute({ auth: 'public', body: resetPasswordSchema, rateLimit: RateLimitPresets.sensitive }, async ({ body }) => {
  const check = await checkToken(body.token, 'invite')
  if (!check.ok) {
    throw new HttpError(400, check.reason === 'expired' ? 'Cette invitation a expiré : demandez-en une nouvelle à un administrateur.' : 'Invitation invalide ou déjà utilisée')
  }
  const user = await getUserByEmail(check.email)
  if (!user) throw new HttpError(404, 'Compte introuvable')
  if (!(await consumeToken(check.id))) throw new HttpError(400, 'Invitation invalide ou déjà utilisée')
  await setPasswordHash(user.id, await hashPassword(body.password))
  return { message: 'Mot de passe enregistré : vous pouvez vous connecter', email: user.email }
})
