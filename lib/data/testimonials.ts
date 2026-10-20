import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { testimonials, users, type ContentStatus, type ImageRef, type Testimonial, type TestimonialType } from '@/db/schema'
import { newId } from '@/lib/ids'
import { generateSlug } from '@/lib/utils'

export type { Testimonial }

const authorColumns = {
  id: users.id,
  firstName: users.firstName,
  lastName: users.lastName,
  userType: users.userType,
  promotionYear: users.promotionYear,
  profileImage: users.profileImage,
  bio: users.bio,
  linkedIn: users.linkedIn,
}

export type TestimonialAuthor = {
  id: string
  firstName: string
  lastName: string
  userType: string
  promotionYear: number | null
  profileImage: ImageRef | null
  bio: string | null
  linkedIn: string | null
}

export type TestimonialWithAuthor = Testimonial & { author: TestimonialAuthor | null }

async function select(where: ReturnType<typeof eq> | ReturnType<typeof and>, order: 'recent' | 'popular' = 'recent', limit?: number) {
  const db = await getDb()
  const query = db
    .select({ testimonial: testimonials, author: authorColumns })
    .from(testimonials)
    .leftJoin(users, eq(users.id, testimonials.authorId))
    .where(where)
    .orderBy(...(order === 'popular' ? [desc(testimonials.likes), desc(testimonials.publishedAt)] : [desc(testimonials.publishedAt)]))
  const rows = limit ? await query.limit(limit) : await query
  return rows.map((row) => ({ ...row.testimonial, author: row.author })) as TestimonialWithAuthor[]
}

export function listPublishedTestimonials() {
  return select(eq(testimonials.status, 'published'))
}

export function listPopularTestimonials(limit = 6) {
  return select(eq(testimonials.status, 'published'), 'popular', limit)
}

export function listPublishedTestimonialsByAuthor(authorId: string) {
  return select(and(eq(testimonials.status, 'published'), eq(testimonials.authorId, authorId)))
}

export function listTestimonialsByAuthor(authorId: string) {
  return select(eq(testimonials.authorId, authorId))
}

export async function getTestimonialBySlug(slug: string, viewer?: { id: string; role: string }) {
  const [row] = await select(eq(testimonials.slug, slug))
  if (!row) return undefined
  if (row.status === 'published') return row
  if (viewer && (viewer.role === 'admin' || viewer.id === row.authorId)) return row
  return undefined
}

export async function getTestimonialById(id: string) {
  const db = await getDb()
  return db.query.testimonials.findFirst({ where: eq(testimonials.id, id) })
}

export interface TestimonialInput {
  title: string
  type: TestimonialType
  excerpt: string
  rating?: number | null
  tags: string[]
  answers: Record<string, string>
  featuredImage?: ImageRef | null
}

export async function createTestimonial(authorId: string, input: TestimonialInput) {
  const db = await getDb()
  const now = new Date()
  const [row] = await db
    .insert(testimonials)
    .values({
      id: newId(),
      slug: `${generateSlug(input.title) || 'temoignage'}-${Date.now()}`,
      ...input,
      rating: input.rating ?? null,
      authorId,
      status: 'published',
      likes: 0,
      publishedAt: now,
    })
    .returning()
  return row
}

export async function updateTestimonial(id: string, input: Partial<TestimonialInput> & { status?: ContentStatus }) {
  const db = await getDb()
  const patch: Record<string, unknown> = { ...input, updatedAt: new Date() }
  if (input.status === 'published') {
    const current = await getTestimonialById(id)
    if (current && !current.publishedAt) patch.publishedAt = new Date()
  }
  const [row] = await db.update(testimonials).set(patch).where(eq(testimonials.id, id)).returning()
  return row
}

export async function deleteTestimonial(id: string) {
  const db = await getDb()
  await db.delete(testimonials).where(eq(testimonials.id, id))
}

export async function listAllTestimonials() {
  const db = await getDb()
  const rows = await db
    .select({ testimonial: testimonials, author: { id: users.id, firstName: users.firstName, lastName: users.lastName } })
    .from(testimonials)
    .leftJoin(users, eq(users.id, testimonials.authorId))
    .orderBy(desc(testimonials.createdAt))
  return rows.map((row) => ({ ...row.testimonial, author: row.author }))
}
