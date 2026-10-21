import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { countAdmins, deleteUser } from '@/lib/data/users'
import { logger } from '@/lib/logger'

/**
 * Suppression de son propre compte : annonces, témoignages et abonnement
 * partent avec lui (cascade), le journal d'activité est anonymisé.
 */
export const DELETE = apiRoute({ auth: 'user', rateLimit: { maxRequests: 3, windowMs: 60 * 60_000 } }, async ({ user }) => {
  if (user.role === 'admin' && (await countAdmins()) <= 1) {
    throw new HttpError(409, 'Vous êtes le dernier administrateur : nommez-en un autre avant de supprimer votre compte.')
  }
  await deleteUser(user.id)
  logger.info('Compte supprimé à la demande du membre', { userId: user.id })
  return { success: true, message: 'Compte supprimé avec succès' }
})
