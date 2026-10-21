import { and, asc, desc, eq, gt, isNull, or, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { announcements, users, type Announcement, type AnnouncementType, type ContentStatus, type Experience, type ImageRef } from '@/db/schema'
import { newId } from '@/lib/ids'
import { generateSlug } from '@/lib/utils'

export type { Announcement }

export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  job_offer: "Offre d'emploi",
  internship: 'Stage',
  opportunity: 'Opportunité',
  event: 'Événement',
  school_supplies: 'Vente de matériel scolaire',
  other: 'Autre',
}

const authorColumns = {
  id: users.id,
  firstName: users.firstName,
  lastName: users.lastName,
  userType: users.userType,
  profileImage: users.profileImage,
  experience: users.experience,
  linkedIn: users.linkedIn,
  email: users.email,
}

export type AnnouncementAuthor = {
  id: string
  firstName: string
  lastName: string
  userType: string
  profileImage: ImageRef | null
  experience: Experience[]
  linkedIn: string | null
  email: string
}

export type AnnouncementWithAuthor = Announcement & { author: AnnouncementAuthor | null }

/** Annonces visibles : publiées et non expirées */
const visible = () =>
  and(eq(announcements.status, 'published'), or(isNull(announcements.expiresAt), gt(announcements.expiresAt, sql`now()`)))

export async function listPublishedAnnouncements(limit?: number): Promise<AnnouncementWithAuthor[]> {
  const db = await getDb()
  const query = db
    .select({ announcement: announcements, author: authorColumns })
    .from(announcements)
    .leftJoin(users, eq(users.id, announcements.authorId))
    .where(visible())
    .orderBy(desc(announcements.publishedAt))
  const rows = limit ? await query.limit(limit) : await query
  return rows.map((row) => ({ ...row.announcement, author: row.author }))
}

/** Événements à venir, le plus proche d'abord */
export async function listUpcomingEvents(limit = 3) {
  const db = await getDb()
  return db
    .select({
      id: announcements.id,
      slug: announcements.slug,
      title: announcements.title,
      company: announcements.company,
      location: announcements.location,
      eventDate: announcements.eventDate,
    })
    .from(announcements)
    .where(and(eq(announcements.type, 'event'), eq(announcements.status, 'published'), gt(announcements.eventDate, sql`now()`)))
    .orderBy(asc(announcements.eventDate))
    .limit(limit)
}

/**
 * Détail d'une annonce. Un brouillon, une annonce archivée ou expirée n'est
 * visible que par son auteur et les administrateurs.
 */
export async function getAnnouncementBySlug(slug: string, viewer?: { id: string; role: string }) {
  const db = await getDb()
  const [row] = await db
    .select({ announcement: announcements, author: authorColumns })
    .from(announcements)
    .leftJoin(users, eq(users.id, announcements.authorId))
    .where(eq(announcements.slug, slug))
    .limit(1)
  if (!row) return undefined
  const result: AnnouncementWithAuthor = { ...row.announcement, author: row.author }
  const isVisible =
    result.status === 'published' && (!result.expiresAt || result.expiresAt.getTime() > Date.now())
  if (isVisible) return result
  if (viewer && (viewer.role === 'admin' || viewer.id === result.authorId)) return result
  return undefined
}

export async function getAnnouncementById(id: string) {
  const db = await getDb()
  return db.query.announcements.findFirst({ where: eq(announcements.id, id) })
}

export async function listAnnouncementsByAuthor(authorId: string) {
  const db = await getDb()
  return db.query.announcements.findMany({
    where: eq(announcements.authorId, authorId),
    orderBy: desc(announcements.publishedAt),
  })
}

export interface AnnouncementInput {
  title: string
  type: AnnouncementType
  company?: string | null
  location?: string | null
  description: string
  contactEmail?: string | null
  contactPhone?: string | null
  externalLink?: string | null
  expiresAt?: Date | null
  eventDate?: Date | null
}

export async function createAnnouncement(authorId: string, input: AnnouncementInput) {
  const db = await getDb()
  const [row] = await db
    .insert(announcements)
    .values({
      id: newId(),
      slug: `${generateSlug(input.title) || 'annonce'}-${Date.now()}`,
      ...input,
      eventDate: input.type === 'event' ? (input.eventDate ?? null) : null,
      authorId,
      status: 'published',
      publishedAt: new Date(),
    })
    .returning()
  return row
}

export async function updateAnnouncement(id: string, input: Partial<AnnouncementInput> & { status?: ContentStatus }) {
  const db = await getDb()
  const patch: Record<string, unknown> = { ...input, updatedAt: new Date() }
  if (input.type && input.type !== 'event') patch.eventDate = null
  const [row] = await db.update(announcements).set(patch).where(eq(announcements.id, id)).returning()
  return row
}

export async function deleteAnnouncement(id: string) {
  const db = await getDb()
  await db.delete(announcements).where(eq(announcements.id, id))
}

/** Toutes les annonces (administration), brouillons et archives compris */
export async function listAllAnnouncements() {
  const db = await getDb()
  const rows = await db
    .select({ announcement: announcements, author: { id: users.id, firstName: users.firstName, lastName: users.lastName } })
    .from(announcements)
    .leftJoin(users, eq(users.id, announcements.authorId))
    .orderBy(desc(announcements.publishedAt))
  return rows.map((row) => ({ ...row.announcement, author: row.author }))
}
