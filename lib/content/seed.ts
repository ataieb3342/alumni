import type { Db } from '@/db'
import { contentEntries } from '@/db/schema'
import { CONTENT_DEFAULTS, CONTENT_KEYS } from './definitions'

/**
 * Publie les textes par défaut des pages qui n'existent pas encore en base.
 * Ne touche jamais un contenu déjà présent (idempotent).
 */
export async function seedDefaultContent(db: Db) {
  let created = 0
  for (const key of CONTENT_KEYS) {
    const result = await db
      .insert(contentEntries)
      .values({ key, published: CONTENT_DEFAULTS[key] as Record<string, unknown>, publishedAt: new Date() })
      .onConflictDoNothing()
      .returning({ key: contentEntries.key })
    created += result.length
  }
  return { keys: CONTENT_KEYS.length, created }
}
