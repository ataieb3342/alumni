/**
 * Connexion à la base.
 *
 * - `DATABASE_URL=postgres://…` (production : Neon, Supabase ou un Postgres
 *   auto-hébergé) → pilote `postgres` ;
 * - `DATABASE_URL=pglite:./.data/pglite` (développement local, sans Docker) ou
 *   `pglite:memory` (tests) → Postgres embarqué en WebAssembly. Les migrations
 *   y sont appliquées automatiquement au premier accès.
 *
 * Initialisation paresseuse : `next build` n'ouvre aucune connexion.
 */
import path from 'node:path'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import * as schema from './schema'

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>

const MIGRATIONS_FOLDER = path.join(process.cwd(), 'db', 'migrations')

declare global {
  // Survit au rechargement à chaud en développement (une seule instance PGlite par processus)
  var __alumniDb: Promise<Db> | undefined
}

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (url) return url
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_LOCAL_DB) {
    throw new Error('DATABASE_URL manquant')
  }
  return 'pglite:./.data/pglite'
}

async function connect(url: string): Promise<Db> {
  if (url.startsWith('pglite:')) {
    const location = url.slice('pglite:'.length).replace(/^\/\//, '')
    const { PGlite } = await import('@electric-sql/pglite')
    const { drizzle } = await import('drizzle-orm/pglite')
    const { migrate } = await import('drizzle-orm/pglite/migrator')
    if (location !== 'memory') {
      const { mkdirSync } = await import('node:fs')
      mkdirSync(path.dirname(path.resolve(location)), { recursive: true })
    }
    const client = location === 'memory' ? new PGlite() : new PGlite(path.resolve(location))
    const db = drizzle(client, { schema })
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
    return db as unknown as Db
  }

  const { default: postgres } = await import('postgres')
  const { drizzle } = await import('drizzle-orm/postgres-js')
  const client = postgres(url, {
    max: Number(process.env.DATABASE_POOL_SIZE ?? 5),
    // Les poolers (Neon, Supabase) ne gèrent pas les requêtes préparées nommées
    prepare: false,
  })
  return drizzle(client, { schema }) as unknown as Db
}

export function getDb(): Promise<Db> {
  if (!globalThis.__alumniDb) {
    globalThis.__alumniDb = connect(databaseUrl()).catch((error) => {
      globalThis.__alumniDb = undefined
      throw error
    })
  }
  return globalThis.__alumniDb
}

/** Pour les tests : repart d'une base vierge */
export function resetDbForTests() {
  globalThis.__alumniDb = undefined
}

export { schema }
