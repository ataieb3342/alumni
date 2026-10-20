/**
 * Comptes de test pour la base LOCALE (PGlite) : un administrateur et un
 * membre, aux adresses @local.test. Les mots de passe sont tirés au hasard et
 * écrits dans .data/local-accounts.json (non versionné, jamais affiché).
 *
 * Refuse de tourner sur une base PostgreSQL distante.
 * Usage : npm run db:seed-local
 */
import fs from 'node:fs'
import path from 'node:path'
import { eq } from 'drizzle-orm'
import { databaseUrl, getDb } from '@/db'
import { users } from '@/db/schema'
import { hashPassword } from '@/lib/auth/password'
import { newId, newSecretToken } from '@/lib/ids'
import { seedDefaultContent } from '@/lib/content/seed'

export const LOCAL_ACCOUNTS = [
  { key: 'admin', email: 'admin@local.test', firstName: 'Admin', lastName: 'Local', role: 'admin' as const, userType: 'alumni' as const },
  { key: 'member', email: 'membre@local.test', firstName: 'Camille', lastName: 'Essai', role: 'member' as const, userType: 'alumni' as const },
]

async function main() {
  if (!databaseUrl().startsWith('pglite:')) {
    console.error('Refusé : ce script ne s’exécute que sur la base locale PGlite.')
    process.exit(1)
  }
  const db = await getDb()
  await seedDefaultContent(db)
  const file = path.resolve('.data/local-accounts.json')
  const credentials: Record<string, { email: string; password: string }> = {}
  for (const account of LOCAL_ACCOUNTS) {
    const password = `Aa1!${newSecretToken().slice(0, 20)}`
    const existing = await db.query.users.findFirst({ where: eq(users.email, account.email) })
    const values = {
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      role: account.role,
      userType: account.userType,
      accountStatus: 'active' as const,
      passwordHash: await hashPassword(password),
      isVisibleInDirectory: false,
      legacy: { source: 'local-seed' },
    }
    if (existing) await db.update(users).set(values).where(eq(users.id, existing.id))
    else await db.insert(users).values({ id: `local-${account.key}-${newId(8)}`, ...values })
    credentials[account.key] = { email: account.email, password }
  }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(credentials, null, 2), { mode: 0o600 })
  console.log(`Comptes locaux prêts (${LOCAL_ACCOUNTS.map((a) => a.email).join(', ')}) ; identifiants dans .data/local-accounts.json`)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
