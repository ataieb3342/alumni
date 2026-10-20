// lib/auth.ts
import NextAuth, { CredentialsSignin } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import LinkedInProvider from 'next-auth/providers/linkedin'
import { authConfig } from './auth.config'
import { logActivity, getClientIp } from './activity-logger'
import { logger } from './logger'
import { hashPassword, needsRehash, simulatePasswordCheck, verifyPassword } from './auth/password'
import { getUserByEmail, getUserById, normalizeEmail, recordLogin, setPasswordHash, updateUser, type User } from './data/users'
import { rateLimitKey } from './rate-limit'

// Types pour les profils OAuth
interface LinkedInProfile {
  given_name?: string
  family_name?: string
  profile?: string
}

interface GoogleProfile {
  given_name?: string
  family_name?: string
}

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

/** Délai après lequel le jeton relit le compte (rôle, statut, nom, photo) */
const REFRESH_MS = 5 * 60 * 1000

function tokenFieldsFromUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    userType: user.userType,
    role: user.role,
    accountStatus: user.accountStatus,
    firstName: user.firstName,
    lastName: user.lastName,
    picture: user.profileImage?.url ?? null,
    isNewUser: false,
    needsTypeSelection: false,
    checkedAt: Date.now(),
  }
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

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: { params: { prompt: 'consent', access_type: 'offline', response_type: 'code' } },
          }),
        ]
      : []),
    ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
      ? [
          LinkedInProvider({
            clientId: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
            authorization: { params: { scope: 'openid profile email' } },
            wellKnown: 'https://www.linkedin.com/oauth/.well-known/openid-configuration',
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        const email = typeof credentials?.email === 'string' ? normalizeEmail(credentials.email) : ''
        const password = typeof credentials?.password === 'string' ? credentials.password : ''
        if (!email || !password) throw new InvalidCredentialsError()
        const user = await authorizeCredentials(email, password, getClientIp(request))
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          userType: user.userType,
          role: user.role,
          accountStatus: user.accountStatus,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') {
        if (user?.id) {
          await logActivity({ userId: user.id, action: 'login', details: 'Connexion par email/mot de passe' })
        }
        return true
      }

      if (account && (account.provider === 'google' || account.provider === 'linkedin')) {
        try {
          const email = user.email ? normalizeEmail(user.email) : ''
          if (!email) return false
          const existing = await getUserByEmail(email)

          if (existing) {
            // Rattachement automatique par e-mail (comportement d'origine)
            if (!existing.oauthProvider) {
              await updateUser(existing.id, { oauthProvider: account.provider, oauthId: account.providerAccountId })
            }
            user.id = existing.id
            user.userType = existing.userType
            user.role = existing.role
            user.accountStatus = existing.accountStatus
            user.isNewUser = false
            if (existing.accountStatus !== 'active') return '/validation-en-cours'
            await recordLogin(existing.id)
            await logActivity({
              userId: existing.id,
              action: 'login',
              details: `Connexion via ${account.provider === 'google' ? 'Google' : 'LinkedIn'}`,
            })
            return true
          }

          // Nouveau compte : créé seulement après le choix du type de membre (/choisir-type)
          user.id = 'temp-' + account.providerAccountId
          user.isNewUser = true
          return true
        } catch (error) {
          logger.error('Erreur lors de la connexion OAuth', error)
          return false
        }
      }

      return true
    },

    async jwt({ token, user, account, profile, trigger }) {
      if (user) {
        token.id = user.id ?? ''
        token.provider = account?.provider ?? ''
        token.isNewUser = user.isNewUser ?? false

        if (user.id?.startsWith('temp-') && account && profile) {
          token.needsTypeSelection = true
          token.oauthProvider = account.provider
          token.oauthId = account.providerAccountId
          token.email = user.email ?? undefined
          token.userType = ''
          token.role = 'member'
          token.accountStatus = 'pending'

          let firstName = ''
          let lastName = ''
          if (account.provider === 'linkedin') {
            const linkedIn = profile as LinkedInProfile
            firstName = linkedIn.given_name || ''
            lastName = linkedIn.family_name || ''
            token.linkedInUrl = linkedIn.profile || ''
          } else if (account.provider === 'google') {
            const google = profile as GoogleProfile
            firstName = google.given_name || ''
            lastName = google.family_name || ''
          }
          if (!firstName && !lastName && user.name) {
            const [first, ...rest] = user.name.split(' ')
            firstName = first || ''
            lastName = rest.join(' ')
          }
          token.firstName = firstName
          token.lastName = lastName
          return token
        }

        const dbUser = user.id ? await getUserById(user.id) : undefined
        if (dbUser) Object.assign(token, tokenFieldsFromUser(dbUser))
        return token
      }

      // Compte OAuth en cours de création : rattacher le vrai compte dès qu'il existe
      if (token.id?.startsWith('temp-')) {
        if (trigger === 'update' && token.email) {
          const created = await getUserByEmail(token.email)
          if (created) Object.assign(token, tokenFieldsFromUser(created))
        }
        return token
      }

      // Relecture périodique : un compte suspendu, supprimé ou rétrogradé perd ses droits
      if (token.id && (trigger === 'update' || !token.checkedAt || Date.now() - token.checkedAt > REFRESH_MS)) {
        const dbUser = await getUserById(token.id)
        if (!dbUser) return null
        Object.assign(token, tokenFieldsFromUser(dbUser))
      }
      return token
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) return url
      } catch {
        // URL invalide
      }
      return baseUrl
    },
  },
})
