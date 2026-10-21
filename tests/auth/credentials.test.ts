// @vitest-environment node
import bcrypt from 'bcryptjs'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { activityLogs, users } from '@/db/schema'
import {
  authorizeCredentials,
  DisabledAccountError,
  InvalidCredentialsError,
  NoPasswordError,
  PendingAccountError,
  TooManyAttemptsError,
} from '@/lib/auth/credentials'
import { resetRateLimitStore } from '@/lib/rate-limit'
import { createUser, freshDb } from '../helpers/db'

const PASSWORD = 'Migration@2026!'
let ip = 0
const nextIp = () => `192.0.2.${++ip}`

describe('Connexion e-mail / mot de passe', () => {
  beforeAll(async () => {
    await freshDb()
  })
  beforeEach(() => resetRateLimitStore())

  it('connecte un compte migré avec son hash Sanity inchangé ($2b$10$)', async () => {
    const legacyHash = await bcrypt.hash(PASSWORD, 10)
    const user = await createUser({ email: 'migre@example.test', passwordHash: legacyHash })
    const result = await authorizeCredentials('migre@example.test', PASSWORD, nextIp())
    expect(result.id).toBe(user.id)
  })

  it('recalcule le hash de façon transparente à la connexion quand le coût a augmenté', async () => {
    const previous = process.env.BCRYPT_COST
    process.env.BCRYPT_COST = '11'
    try {
      const legacyHash = await bcrypt.hash(PASSWORD, 10)
      const user = await createUser({ email: 'rehash@example.test', passwordHash: legacyHash })
      await authorizeCredentials('rehash@example.test', PASSWORD, nextIp())
      const db = await getDb()
      const [after] = await db.select().from(users).where(eq(users.id, user.id))
      expect(after.passwordHash).not.toBe(legacyHash)
      expect(after.passwordHash).toMatch(/^\$2[ab]\$11\$/)
      // Le même mot de passe fonctionne toujours, sans réinitialisation
      await expect(authorizeCredentials('rehash@example.test', PASSWORD, nextIp())).resolves.toMatchObject({ id: user.id })
    } finally {
      process.env.BCRYPT_COST = previous
    }
  })

  it('ignore la casse de l’e-mail', async () => {
    await createUser({ email: 'casse@example.test', password: PASSWORD })
    await expect(authorizeCredentials('CASSE@Example.Test', PASSWORD, nextIp())).resolves.toBeTruthy()
  })

  it('renvoie la même erreur pour un compte inconnu et un mauvais mot de passe', async () => {
    await createUser({ email: 'existe@example.test', password: PASSWORD })
    const unknown = await authorizeCredentials('inconnu@example.test', PASSWORD, nextIp()).catch((e) => e)
    const wrong = await authorizeCredentials('existe@example.test', 'Mauvais@123456', nextIp()).catch((e) => e)
    expect(unknown).toBeInstanceOf(InvalidCredentialsError)
    expect(wrong).toBeInstanceOf(InvalidCredentialsError)
    expect(unknown.code).toBe(wrong.code)
  })

  it('signale un compte sans mot de passe (OAuth ou importé)', async () => {
    await createUser({ email: 'oauth@example.test', oauthProvider: 'google' })
    await expect(authorizeCredentials('oauth@example.test', PASSWORD, nextIp())).rejects.toBeInstanceOf(NoPasswordError)
  })

  it('ne révèle le statut « en attente » qu’après un mot de passe correct', async () => {
    await createUser({ email: 'attente@example.test', password: PASSWORD, accountStatus: 'pending' })
    await expect(authorizeCredentials('attente@example.test', 'Mauvais@123456', nextIp())).rejects.toBeInstanceOf(InvalidCredentialsError)
    await expect(authorizeCredentials('attente@example.test', PASSWORD, nextIp())).rejects.toBeInstanceOf(PendingAccountError)
  })

  it('refuse un compte suspendu', async () => {
    await createUser({ email: 'suspendu@example.test', password: PASSWORD, accountStatus: 'suspended' })
    await expect(authorizeCredentials('suspendu@example.test', PASSWORD, nextIp())).rejects.toBeInstanceOf(DisabledAccountError)
  })

  it('limite à 5 tentatives par minute et par IP', async () => {
    const attacker = nextIp()
    for (let i = 0; i < 5; i++) {
      await authorizeCredentials('inconnu@example.test', 'x', attacker).catch(() => undefined)
    }
    await expect(authorizeCredentials('inconnu@example.test', 'x', attacker)).rejects.toBeInstanceOf(TooManyAttemptsError)
  })

  it('enregistre la date de dernière connexion', async () => {
    const user = await createUser({ email: 'derniere@example.test', password: PASSWORD })
    await authorizeCredentials('derniere@example.test', PASSWORD, nextIp())
    const db = await getDb()
    const [after] = await db.select().from(users).where(eq(users.id, user.id))
    expect(after.lastLoginAt).toBeInstanceOf(Date)
    expect(await db.select().from(activityLogs)).toBeDefined()
  })
})
