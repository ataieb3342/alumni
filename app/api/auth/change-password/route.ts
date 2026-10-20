import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { setPasswordHash } from '@/lib/data/users'
import { RateLimitPresets } from '@/lib/rate-limit'
import { changePasswordSchema } from '@/lib/validations'

export const POST = apiRoute(
  { auth: 'user', body: changePasswordSchema, rateLimit: { ...RateLimitPresets.auth, message: 'Trop de tentatives. Réessayez dans une minute.' } },
  async ({ body, user }) => {
    if (!user.passwordHash) {
      throw new HttpError(400, "Votre compte n'a pas encore de mot de passe : utilisez « Mot de passe oublié » pour en définir un.")
    }
    if (!(await verifyPassword(body.currentPassword, user.passwordHash))) {
      throw new HttpError(400, 'Mot de passe actuel incorrect', 'currentPassword')
    }
    await setPasswordHash(user.id, await hashPassword(body.newPassword))
    return { message: 'Mot de passe modifié avec succès' }
  }
)
