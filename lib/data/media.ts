/**
 * Médias téléversés : normalisation (orientation, EXIF retirés, taille
 * maximale), dimensions et vignette floue pour un chargement sans saut.
 */
import { desc, eq, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { media, users, type ImageRef, type Media } from '@/db/schema'
import { newId } from '@/lib/ids'
import { deleteObject, putObject } from '@/lib/storage'

export type { Media }

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'] as const
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const MAX_DIMENSION = 2400

export class MediaError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

export async function storeImage(file: File, options: { uploadedBy: string; alt?: string; folder?: string }): Promise<Media> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    throw new MediaError('Formats acceptés : JPG, PNG, WEBP, GIF ou AVIF')
  }
  if (file.size > MAX_UPLOAD_BYTES) throw new MediaError("L'image ne doit pas dépasser 5 Mo")

  const { default: sharp } = await import('sharp')
  const input = Buffer.from(await file.arrayBuffer())
  let pipeline = sharp(input, { animated: file.type === 'image/gif' }).rotate()
  let metadata
  try {
    metadata = await pipeline.metadata()
  } catch {
    throw new MediaError("Ce fichier n'est pas une image lisible")
  }
  if ((metadata.width ?? 0) > MAX_DIMENSION || (metadata.height ?? 0) > MAX_DIMENSION) {
    pipeline = pipeline.resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
  }
  // Ré-encodage en WebP : retire les métadonnées (GPS…) et allège le fichier
  const isGif = file.type === 'image/gif'
  const output = isGif ? await pipeline.toBuffer() : await pipeline.webp({ quality: 82 }).toBuffer()
  const outMeta = await sharp(output).metadata()
  const blur = await sharp(output).resize(16, 16, { fit: 'inside' }).webp({ quality: 40 }).toBuffer()

  const id = newId()
  const ext = isGif ? 'gif' : 'webp'
  const key = `${options.folder ?? 'uploads'}/${new Date().toISOString().slice(0, 7)}/${id}.${ext}`
  const stored = await putObject(key, output, isGif ? 'image/gif' : 'image/webp')

  const db = await getDb()
  const [row] = await db
    .insert(media)
    .values({
      id,
      url: stored.url,
      storageKey: stored.key,
      filename: file.name.slice(0, 200),
      mimeType: isGif ? 'image/gif' : 'image/webp',
      size: output.length,
      width: outMeta.width ?? null,
      height: outMeta.height ?? null,
      alt: options.alt ?? null,
      blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}`,
      uploadedBy: options.uploadedBy,
    })
    .returning()
  return row
}

export function toImageRef(item: Media, alt?: string): ImageRef {
  return {
    mediaId: item.id,
    url: item.url,
    ...(alt ?? item.alt ? { alt: alt ?? item.alt ?? undefined } : {}),
    ...(item.width ? { width: item.width } : {}),
    ...(item.height ? { height: item.height } : {}),
    ...(item.blurDataUrl ? { blurDataUrl: item.blurDataUrl } : {}),
  }
}

export async function listMedia(options: { page?: number; pageSize?: number } = {}) {
  const db = await getDb()
  const pageSize = options.pageSize ?? 48
  const page = Math.max(1, options.page ?? 1)
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ media, uploader: { firstName: users.firstName, lastName: users.lastName } })
      .from(media)
      .leftJoin(users, eq(users.id, media.uploadedBy))
      .orderBy(desc(media.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: sql<number>`count(*)` }).from(media),
  ])
  return { rows: rows.map((r) => ({ ...r.media, uploader: r.uploader })), total: Number(total), page, pageSize }
}

export async function updateMediaAlt(id: string, alt: string) {
  const db = await getDb()
  const [row] = await db.update(media).set({ alt }).where(eq(media.id, id)).returning()
  return row
}

/** Nombre de références à un média (profils, articles, témoignages, pages) */
export async function countMediaUsages(id: string): Promise<number> {
  const db = await getDb()
  const pattern = `%"mediaId": "${id}"%`
  const compact = `%"mediaId":"${id}"%`
  const result = await db.execute(sql`
    select
      (select count(*) from users where profile_image->>'mediaId' = ${id} or cover_image->>'mediaId' = ${id}) +
      (select count(*) from posts where main_image->>'mediaId' = ${id} or draft::text like ${compact} or draft::text like ${pattern}) +
      (select count(*) from testimonials where featured_image->>'mediaId' = ${id}) +
      (select count(*) from content_entries where published::text like ${compact} or published::text like ${pattern} or draft::text like ${compact} or draft::text like ${pattern})
      as n
  `)
  const rows = (Array.isArray(result) ? result : (result as { rows: unknown[] }).rows) as { n: number | string }[]
  return Number(rows[0]?.n ?? 0)
}

export async function deleteMedia(id: string) {
  const db = await getDb()
  const item = await db.query.media.findFirst({ where: eq(media.id, id) })
  if (!item) throw new MediaError('Média introuvable', 404)
  const usages = await countMediaUsages(id)
  if (usages > 0) throw new MediaError(`Image utilisée à ${usages} endroit${usages > 1 ? 's' : ''} : retirez-la d'abord`, 409)
  await deleteObject(item.storageKey, item.url).catch(() => undefined)
  await db.delete(media).where(eq(media.id, id))
}
