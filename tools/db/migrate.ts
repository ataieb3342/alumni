/**
 * Applique les migrations SQL (db/migrations) sur la base désignée par
 * DATABASE_URL. Idempotent : les migrations déjà passées sont ignorées.
 * En local (PGlite), les migrations s'appliquent déjà au premier accès.
 *
 * Usage : DATABASE_URL=postgres://… npm run db:migrate
 */
import path from 'node:path'
import { databaseUrl } from '@/db'

async function main() {
  const url = databaseUrl()
  const target = url.replace(/\/\/[^@]*@/, '//***@')
  const migrationsFolder = path.join(process.cwd(), 'db', 'migrations')

  if (url.startsWith('pglite:')) {
    const { getDb } = await import('@/db')
    await getDb()
    console.log(`Base locale à jour : ${target}`)
    return
  }

  const { default: postgres } = await import('postgres')
  const { drizzle } = await import('drizzle-orm/postgres-js')
  const { migrate } = await import('drizzle-orm/postgres-js/migrator')
  // Connexion unique : les migrations s'exécutent dans l'ordre, sans pool
  const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} })
  try {
    await migrate(drizzle(client), { migrationsFolder })
    console.log(`Migrations appliquées : ${target}`)
  } finally {
    await client.end()
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
