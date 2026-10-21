/**
 * Contenus des pages : lecture publiée (visiteurs), brouillon (administrateurs),
 * publication et historique des versions.
 */
import { and, desc, eq, lt, sql } from 'drizzle-orm'
import { getDb, type Db } from '@/db'
import { contentEntries, contentVersions } from '@/db/schema'
import {
  CONTENT_DEFAULTS,
  CONTENT_SCHEMAS,
  type ContentKey,
  type ContentOf,
} from '@/lib/content/definitions'
import { mergeWithDefaults } from '@/lib/content/merge'
import { newId } from '@/lib/ids'

/** Nombre de versions conservées par contenu */
const MAX_VERSIONS = 50

function normalize<K extends ContentKey>(key: K, stored: unknown): ContentOf<K> {
  const merged = mergeWithDefaults(CONTENT_DEFAULTS[key], stored)
  const parsed = CONTENT_SCHEMAS[key].safeParse(merged)
  // Un contenu corrompu ne casse jamais la page : on retombe sur les valeurs par défaut
  return (parsed.success ? parsed.data : CONTENT_DEFAULTS[key]) as ContentOf<K>
}

/** Version publiée, telle que la voient les visiteurs */
export async function getPublishedContent<K extends ContentKey>(key: K): Promise<ContentOf<K>> {
  const db = await getDb()
  const row = await db.query.contentEntries.findFirst({ where: eq(contentEntries.key, key) })
  return normalize(key, row?.published)
}

export interface EditableContent<T> {
  data: T
  published: T
  hasDraft: boolean
  publishedAt: Date | null
  updatedAt: Date | null
}

/** Brouillon s'il existe, sinon version publiée (mode édition des administrateurs) */
export async function getEditableContent<K extends ContentKey>(key: K): Promise<EditableContent<ContentOf<K>>> {
  const db = await getDb()
  const row = await db.query.contentEntries.findFirst({ where: eq(contentEntries.key, key) })
  const published = normalize(key, row?.published)
  return {
    data: row?.draft ? normalize(key, row.draft) : published,
    published,
    hasDraft: !!row?.draft,
    publishedAt: row?.publishedAt ?? null,
    updatedAt: row?.updatedAt ?? null,
  }
}

export async function recordVersion(
  db: Db,
  entityType: 'content' | 'post',
  entityId: string,
  action: (typeof contentVersions.$inferInsert)['action'],
  snapshot: Record<string, unknown>,
  userId: string | null,
  /** État publié avant cette action : conservé comme « version d'origine » si l'historique est vide */
  baseline?: Record<string, unknown> | null
) {
  const now = Date.now()
  if (baseline) {
    const [existing] = await db
      .select({ id: contentVersions.id })
      .from(contentVersions)
      .where(and(eq(contentVersions.entityType, entityType), eq(contentVersions.entityId, entityId)))
      .limit(1)
    if (!existing) {
      await db
        .insert(contentVersions)
        .values({ id: newId(), entityType, entityId, action: 'initial', snapshot: baseline, createdBy: null, createdAt: new Date(now - 1) })
    }
  }
  await db.insert(contentVersions).values({ id: newId(), entityType, entityId, action, snapshot, createdBy: userId, createdAt: new Date(now) })
  // Élagage : on garde les MAX_VERSIONS plus récentes
  const keep = await db
    .select({ createdAt: contentVersions.createdAt })
    .from(contentVersions)
    .where(and(eq(contentVersions.entityType, entityType), eq(contentVersions.entityId, entityId)))
    .orderBy(desc(contentVersions.createdAt))
    .limit(1)
    .offset(MAX_VERSIONS - 1)
  if (keep[0]) {
    await db
      .delete(contentVersions)
      .where(
        and(
          eq(contentVersions.entityType, entityType),
          eq(contentVersions.entityId, entityId),
          lt(contentVersions.createdAt, keep[0].createdAt)
        )
      )
  }
}

async function publishedSnapshot(db: Db, key: ContentKey) {
  const row = await db.query.contentEntries.findFirst({ where: eq(contentEntries.key, key), columns: { published: true } })
  return (row?.published as Record<string, unknown> | null | undefined) ?? null
}

/** Valide (Zod) et assainit, puis enregistre le brouillon */
export async function saveContentDraft<K extends ContentKey>(key: K, input: unknown, userId: string) {
  const data = CONTENT_SCHEMAS[key].parse(input) as Record<string, unknown>
  const db = await getDb()
  const baseline = await publishedSnapshot(db, key)
  const now = new Date()
  await db
    .insert(contentEntries)
    .values({ key, draft: data, updatedAt: now, updatedBy: userId })
    .onConflictDoUpdate({ target: contentEntries.key, set: { draft: data, updatedAt: now, updatedBy: userId } })
  await recordVersion(db, 'content', key, 'save', data, userId, baseline)
  return data as ContentOf<K>
}

/** Publie le brouillon (ou `input` s'il est fourni, après validation) */
export async function publishContent<K extends ContentKey>(key: K, userId: string, input?: unknown) {
  const db = await getDb()
  const baseline = await publishedSnapshot(db, key)
  let data: Record<string, unknown>
  if (input !== undefined) {
    data = CONTENT_SCHEMAS[key].parse(input) as Record<string, unknown>
  } else {
    const row = await db.query.contentEntries.findFirst({ where: eq(contentEntries.key, key) })
    if (!row?.draft) throw new ContentError('Aucun brouillon à publier', 409)
    data = CONTENT_SCHEMAS[key].parse(row.draft) as Record<string, unknown>
  }
  const now = new Date()
  await db
    .insert(contentEntries)
    .values({ key, published: data, draft: null, publishedAt: now, publishedBy: userId, updatedAt: now, updatedBy: userId })
    .onConflictDoUpdate({
      target: contentEntries.key,
      set: { published: data, draft: null, publishedAt: now, publishedBy: userId, updatedAt: now, updatedBy: userId },
    })
  await recordVersion(db, 'content', key, 'publish', data, userId, baseline)
  return data as ContentOf<K>
}

export async function discardContentDraft(key: ContentKey, userId: string) {
  const db = await getDb()
  await db
    .update(contentEntries)
    .set({ draft: null, updatedAt: new Date(), updatedBy: userId })
    .where(eq(contentEntries.key, key))
}

export async function listVersions(entityType: 'content' | 'post', entityId: string) {
  const db = await getDb()
  return db.query.contentVersions.findMany({
    where: and(eq(contentVersions.entityType, entityType), eq(contentVersions.entityId, entityId)),
    orderBy: desc(contentVersions.createdAt),
    limit: MAX_VERSIONS,
  })
}

/** Restaure une version dans le brouillon : il reste à la publier */
export async function restoreContentVersion(key: ContentKey, versionId: string, userId: string) {
  const db = await getDb()
  const version = await db.query.contentVersions.findFirst({
    where: and(eq(contentVersions.id, versionId), eq(contentVersions.entityType, 'content'), eq(contentVersions.entityId, key)),
  })
  if (!version) throw new ContentError('Version introuvable', 404)
  return saveContentDraftFromVersion(key, version.snapshot, userId)
}

async function saveContentDraftFromVersion<K extends ContentKey>(key: K, snapshot: unknown, userId: string) {
  const data = normalize(key, snapshot) as Record<string, unknown>
  const db = await getDb()
  const baseline = await publishedSnapshot(db, key)
  const now = new Date()
  await db
    .insert(contentEntries)
    .values({ key, draft: data, updatedAt: now, updatedBy: userId })
    .onConflictDoUpdate({ target: contentEntries.key, set: { draft: data, updatedAt: now, updatedBy: userId } })
  await recordVersion(db, 'content', key, 'restore', data, userId, baseline)
  return data as ContentOf<K>
}

/** Contenus ayant un brouillon non publié (tableau de bord) */
export async function listContentDrafts() {
  const db = await getDb()
  return db
    .select({ key: contentEntries.key, updatedAt: contentEntries.updatedAt, publishedAt: contentEntries.publishedAt })
    .from(contentEntries)
    .where(sql`${contentEntries.draft} is not null`)
}

export class ContentError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

/** Versions mises en forme pour l'interface (auteur, résumé lisible) */
export async function listVersionsForUi(entityType: 'content' | 'post', entityId: string) {
  const db = await getDb()
  const { users } = await import('@/db/schema')
  const rows = await db
    .select({
      id: contentVersions.id,
      action: contentVersions.action,
      createdAt: contentVersions.createdAt,
      snapshot: contentVersions.snapshot,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(contentVersions)
    .leftJoin(users, eq(users.id, contentVersions.createdBy))
    .where(and(eq(contentVersions.entityType, entityType), eq(contentVersions.entityId, entityId)))
    .orderBy(desc(contentVersions.createdAt))
    .limit(MAX_VERSIONS)
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    createdAt: row.createdAt.toISOString(),
    author: row.firstName ? `${row.firstName} ${row.lastName ?? ''}`.trim() : null,
    summary: summarize(row.snapshot),
  }))
}

/** Premier texte significatif d'une version, pour la reconnaître dans la liste */
function summarize(snapshot: unknown): string {
  const texts: string[] = []
  const visit = (value: unknown) => {
    if (texts.length >= 3) return
    if (typeof value === 'string') {
      const text = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      if (text.length > 3 && !/^(\/|https?:|data:)/.test(text)) texts.push(text)
    } else if (Array.isArray(value)) value.forEach(visit)
    else if (value && typeof value === 'object') Object.values(value).forEach(visit)
  }
  visit(snapshot)
  return texts.join(' · ').slice(0, 160)
}
