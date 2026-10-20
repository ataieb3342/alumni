/**
 * Vérification e-mail / mot de passe (fournisseur Credentials de NextAuth).
 * Isolée de la configuration NextAuth pour être testée directement.
 */
import { CredentialsSignin } from '@auth/core/errors'
import { hashPassword, needsRehash, simulatePasswordCheck, verifyPassword } from './password'
import { getUserByEmail, recordLogin, setPasswordHash } from '@/lib/data/users'
import { logger } from '@/lib/logger'
import { rateLimitKey } from '@/lib/rate-limit'

/** Erreurs de connexion transmises au formulaire (`result.code`) */
export class InvalidCredentialsError extends CredentialsSignin {
  code = 'invalid_credentials'
}
export class NoPasswordError extends CredentialsSignin {
  code = 'oauth_account'
}
export class PendingAccountError extends CredentialsSignin {
  code = 'pending_validation'
}
export class DisabledAccountError extends CredentialsSignin {
  code = 'account_disabled'
}
export class TooManyAttemptsError extends CredentialsSignin {
  code = 'rate_limited'
}

/**
 * Vérification e-mail / mot de passe, en un seul aller-retour.
 * Les hash bcrypt migrés de Sanity sont vérifiés tels quels, puis recalculés
 * au coût actuel si nécessaire (ré-hachage transparent).
 */
export async function authorizeCredentials(email: string, password: string, ip = 'unknown') {
  if (!rateLimitKey(`login:${ip}`, { maxRequests: 5, windowMs: 60_000 }).success) {
    throw new TooManyAttemptsError()
  }
  const user = await getUserByEmail(email)
  if (!user) {
    await simulatePasswordCheck(password)
    throw new InvalidCredentialsError()
  }
  if (!user.passwordHash) {
    await simulatePasswordCheck(password)
    throw new NoPasswordError()
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    throw new InvalidCredentialsError()
  }
  // Mot de passe correct : on peut révéler le statut sans fuite d'information
  if (user.accountStatus === 'pending') throw new PendingAccountError()
  if (user.accountStatus !== 'active') throw new DisabledAccountError()

  if (needsRehash(user.passwordHash)) {
    try {
      await setPasswordHash(user.id, await hashPassword(password))
    } catch (error) {
      logger.error('Ré-hachage du mot de passe impossible', error)
    }
  }
  await recordLogin(user.id)
  return user
}

