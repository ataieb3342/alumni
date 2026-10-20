/**
 * Articles du blog : version publiée en colonnes, brouillon en JSON,
 * historique des versions partagé avec les pages (content_versions).
 */
import { and, desc, eq, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '@/db'
import { posts, POST_VISIBILITIES, type Post, type PostContent } from '@/db/schema'
import { imageSchema } from '@/lib/content/definitions'
import { ContentError, recordVersion } from '@/lib/data/content'
import { newId } from '@/lib/ids'
import { sanitizeRichText } from '@/lib/richtext'
import { generateSlug } from '@/lib/utils'

export type { Post, PostContent }

export const postContentSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est obligatoire').max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(96)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Adresse : lettres minuscules, chiffres et tirets uniquement'),
  excerpt: z.string().max(400).optional().default(''),
  bodyHtml: z.string().max(200_000).transform((value) => sanitizeRichText(value)),
  mainImage: imageSchema.optional(),
  visibility: z.enum(POST_VISIBILITIES),
  publishedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Date invalide'),
})

export type PostListItem = Pick<Post, 'id' | 'slug' | 'title' | 'excerpt' | 'mainImage' | 'publishedAt' | 'visibility' | 'status'>

const listColumns = {
  id: posts.id,
  slug: posts.slug,
  title: posts.title,
  excerpt: posts.excerpt,
  mainImage: posts.mainImage,
  publishedAt: posts.publishedAt,
  visibility: posts.visibility,
  status: posts.status,
}

/** Articles publiés ; les articles « membres » ne sont listés que pour les membres connectés */
export async function listPublishedPosts(options: { includeMembersOnly: boolean; limit?: number }): Promise<PostListItem[]> {
  const db = await getDb()
  const query = db
    .select(listColumns)
    .from(posts)
    .where(and(eq(posts.status, 'published'), options.includeMembersOnly ? undefined : eq(posts.visibility, 'public')))
    .orderBy(desc(posts.publishedAt))
  return options.limit ? query.limit(options.limit) : query
}

/** Brouillons et articles jamais publiés (visibles seulement des administrateurs) */
export async function listUnpublishedPosts(): Promise<PostListItem[]> {
  const db = await getDb()
  return db
    .select(listColumns)
    .from(posts)
    .where(sql`${posts.status} <> 'published' or ${posts.draft} is not null`)
    .orderBy(desc(posts.updatedAt))
}

export async function getPostBySlug(slug: string) {
  const db = await getDb()
  return db.query.posts.findFirst({ where: eq(posts.slug, slug) })
}

export async function getPostById(id: string) {
  const db = await getDb()
  return db.query.posts.findFirst({ where: eq(posts.id, id) })
}

/** Contenu publié d'un article, au format éditable */
export function publishedContent(post: Post): PostContent {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? '',
    bodyHtml: post.bodyHtml,
    mainImage: post.mainImage ?? null,
    visibility: post.visibility,
    publishedAt: post.publishedAt.toISOString(),
  }
}

/** Version publiée d'un article (importé ou déjà publié), gardée comme version d'origine de l'historique */
function postBaseline(post: Post) {
  return post.status === 'published' ? { ...publishedContent(post) } : null
}

/** Ce que voit un administrateur en mode édition : le brouillon s'il existe */
export function editableContent(post: Post): PostContent {
  return post.draft ?? publishedContent(post)
}

async function assertSlugAvailable(slug: string, exceptId?: string) {
  const db = await getDb()
  const clash = await db.query.posts.findFirst({
    where: exceptId ? and(eq(posts.slug, slug), ne(posts.id, exceptId)) : eq(posts.slug, slug),
  })
  if (clash) throw new ContentError('Cette adresse est déjà utilisée par un autre article', 409)
}

export async function createPost(input: { title: string }, userId: string) {
  const db = await getDb()
  let slug = generateSlug(input.title) || 'article'
  if (await getPostBySlug(slug)) slug = `${slug}-${Date.now().toString(36)}`
  const now = new Date()
  const content: PostContent = {
    title: input.title,
    slug,
    excerpt: '',
    bodyHtml: '<p></p>',
    mainImage: null,
    visibility: 'public',
    publishedAt: now.toISOString(),
  }
  const [post] = await db
    .insert(posts)
    .values({
      id: newId(),
      slug,
      status: 'draft',
      visibility: 'public',
      title: input.title,
      bodyHtml: '',
      publishedAt: now,
      draft: content,
      updatedBy: userId,
    })
    .returning()
  await recordVersion(db, 'post', post.id, 'create', { ...content }, userId)
  return post
}

export async function savePostDraft(id: string, input: unknown, userId: string) {
  const content = postContentSchema.parse(input) as PostContent
  const post = await getPostById(id)
  if (!post) throw new ContentError('Article introuvable', 404)
  await assertSlugAvailable(content.slug, id)
  const db = await getDb()
  await db.update(posts).set({ draft: content, updatedAt: new Date(), updatedBy: userId }).where(eq(posts.id, id))
  await recordVersion(db, 'post', id, 'save', { ...content }, userId, postBaseline(post))
  return content
}

/** Publie le brouillon (ou `input`) : les visiteurs voient la nouvelle version */
export async function publishPost(id: string, userId: string, input?: unknown) {
  const post = await getPostById(id)
  if (!post) throw new ContentError('Article introuvable', 404)
  const content = postContentSchema.parse(input ?? editableContent(post)) as PostContent
  await assertSlugAvailable(content.slug, id)
  const db = await getDb()
  await db
    .update(posts)
    .set({
      title: content.title,
      slug: content.slug,
      excerpt: content.excerpt || null,
      bodyHtml: content.bodyHtml,
      mainImage: content.mainImage ?? null,
      visibility: content.visibility,
      publishedAt: new Date(content.publishedAt),
      status: 'published',
      draft: null,
      updatedAt: new Date(),
      updatedBy: userId,
    })
    .where(eq(posts.id, id))
  await recordVersion(db, 'post', id, 'publish', { ...content }, userId, postBaseline(post))
  return content
}

/** Retire l'article du site public, sans le supprimer */
export async function unpublishPost(id: string, userId: string) {
  const post = await getPostById(id)
  if (!post) throw new ContentError('Article introuvable', 404)
  const db = await getDb()
  await db
    .update(posts)
    .set({ status: 'draft', draft: post.draft ?? publishedContent(post), updatedAt: new Date(), updatedBy: userId })
    .where(eq(posts.id, id))
  await recordVersion(db, 'post', id, 'unpublish', { ...editableContent(post) }, userId, postBaseline(post))
}

export async function discardPostDraft(id: string, userId: string) {
  const post = await getPostById(id)
  if (!post) throw new ContentError('Article introuvable', 404)
  if (post.status !== 'published') throw new ContentError("Un article jamais publié n'a pas d'autre version à retrouver", 409)
  const db = await getDb()
  await db.update(posts).set({ draft: null, updatedAt: new Date(), updatedBy: userId }).where(eq(posts.id, id))
}

export async function restorePostVersion(id: string, versionId: string, userId: string) {
  const db = await getDb()
  const version = await db.query.contentVersions.findFirst({
    where: (v, { and: both, eq: equal }) => both(equal(v.id, versionId), equal(v.entityType, 'post'), equal(v.entityId, id)),
  })
  if (!version) throw new ContentError('Version introuvable', 404)
  const content = postContentSchema.parse(version.snapshot) as PostContent
  await db.update(posts).set({ draft: content, updatedAt: new Date(), updatedBy: userId }).where(eq(posts.id, id))
  await recordVersion(db, 'post', id, 'restore', { ...content }, userId)
  return content
}

export async function deletePost(id: string, userId: string) {
  const post = await getPostById(id)
  if (!post) throw new ContentError('Article introuvable', 404)
  const db = await getDb()
  // Une trace reste dans l'historique : l'article supprimé peut être recréé
  await recordVersion(db, 'post', id, 'delete', { ...editableContent(post), status: post.status }, userId, postBaseline(post))
  await db.delete(posts).where(eq(posts.id, id))
}
