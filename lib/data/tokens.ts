/**
 * Jetons à usage unique envoyés par e-mail (réinitialisation, invitation).
 * Seule l'empreinte SHA-256 est stockée : une fuite de la base ne permet pas
 * de réutiliser un lien.
 */
import { and, eq, gt, isNull } from 'drizzle-orm'
import { getDb } from '@/db'
import { authTokens } from '@/db/schema'
import { newId, newSecretToken, sha256 } from '@/lib/ids'
import { normalizeEmail } from './users'

export const TOKEN_TTL = {
  reset: 60 * 60 * 1000, // 1 h, comme avant
  invite: 7 * 24 * 60 * 60 * 1000, // 7 jours
} as const

export async function issueToken(email: string, purpose: keyof typeof TOKEN_TTL): Promise<string> {
  const db = await getDb()
  const normalized = normalizeEmail(email)
  // Les liens précédents du même type deviennent invalides
  await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.email, normalized), eq(authTokens.purpose, purpose), isNull(authTokens.usedAt)))
  const token = newSecretToken()
  await db.insert(authTokens).values({
    id: newId(),
    email: normalized,
    tokenHash: await sha256(token),
    purpose,
    expiresAt: new Date(Date.now() + TOKEN_TTL[purpose]),
  })
  return token
}

export type TokenCheck =
  | { ok: true; id: string; email: string }
  | { ok: false; reason: 'invalid' | 'expired' }

export async function checkToken(token: string, purpose: keyof typeof TOKEN_TTL): Promise<TokenCheck> {
  if (!/^[a-f0-9]{64}$/.test(token)) return { ok: false, reason: 'invalid' }
  const db = await getDb()
  const row = await db.query.authTokens.findFirst({
    where: and(eq(authTokens.tokenHash, await sha256(token)), eq(authTokens.purpose, purpose), isNull(authTokens.usedAt)),
  })
  if (!row) return { ok: false, reason: 'invalid' }
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: 'expired' }
  return { ok: true, id: row.id, email: row.email }
}

export async function consumeToken(id: string) {
  const db = await getDb()
  const [row] = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.id, id), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())))
    .returning({ id: authTokens.id })
  return !!row
}
