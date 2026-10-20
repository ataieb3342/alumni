/**
 * Import idempotent de l'instantané Sanity (tools/migration/export-sanity.ts)
 * dans la base PostgreSQL et le stockage d'images.
 *
 * - Les identifiants Sanity sont conservés : relancer l'import met à jour les
 *   mêmes lignes (`ON CONFLICT … DO UPDATE`) sans créer de doublon.
 * - Les hash de mots de passe sont recopiés **tels quels**.
 * - Un rôle admin déjà attribué n'est jamais retiré par un nouvel import.
 * - Les comptes du Studio Sanity (e-mail + rôle) deviennent des comptes
 *   administrateurs sans mot de passe, à inviter (voir REPORT.md).
 *
 * Variables : DATABASE_URL, BLOB_READ_WRITE_TOKEN (sinon stockage fichiers
 * dans MEDIA_DIR), ADMIN_EMAILS (optionnel, e-mails à promouvoir admin).
 *
 * Usage : npm run migrate:import [-- --snapshot .migration/snapshot]
 */
import fs from 'node:fs'
import path from 'node:path'
import { sql } from 'drizzle-orm'
import { getDb } from '@/db'
import * as schema from '@/db/schema'
import { putObject, objectExists } from '@/lib/storage'
import { seedDefaultContent } from '@/lib/content/seed'
import {
  type MediaLookup,
  type SanityDoc,
  transformActivity,
  transformAnnouncement,
  transformNewsletter,
  transformPost,
  transformResetToken,
  transformTestimonial,
  transformUser,
  externalImageFileName,
} from './transform'

function argValue(flag: string, fallback: string): string {
  const index = process.argv.indexOf(flag)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size))

/** `SET colonne = excluded.colonne` pour chaque colonne (noms SQL) mise à jour en cas de conflit */
function excludedSet(table: object, columns: string[]) {
  const sqlNameToKey = new Map<string, string>()
  for (const [key, column] of Object.entries(table)) {
    const name = (column as { name?: unknown })?.name
    if (typeof name === 'string') sqlNameToKey.set(name, key)
  }
  return Object.fromEntries(
    columns.map((column) => {
      const key = sqlNameToKey.get(column)
      if (!key) throw new Error(`Colonne inconnue : ${column}`)
      return [key, sql.raw(`excluded."${column}"`)]
    })
  )
}

export async function runImport(snapshotDir: string) {
  const db = await getDb()
  const docs: SanityDoc[] = fs
    .readFileSync(path.join(snapshotDir, 'documents.ndjson'), 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line))
    // Brouillons Sanity ignorés : les visiteurs ne voyaient que les versions publiées
    .filter((doc: SanityDoc) => !doc._id.startsWith('drafts.'))
  const byType = (type: string) => docs.filter((doc) => doc._type === type)
  const report: Record<string, unknown> = {}

  // ---------------------------------------------------------------- Médias
  const assetsDir = path.join(snapshotDir, 'assets')
  const assets = [...byType('sanity.imageAsset'), ...byType('sanity.fileAsset')]
  const mediaById = new Map<string, typeof schema.media.$inferInsert>()
  let uploaded = 0
  for (const asset of assets) {
    const ext = String(asset.extension ?? 'bin')
    const key = `sanity/${asset._id}.${ext}`
    const file = path.join(assetsDir, `${asset._id}.${ext}`)
    if (!fs.existsSync(file)) throw new Error(`Asset absent de l'instantané : ${asset._id}`)
    const existing = await db.query.media.findFirst({ where: (m, { eq }) => eq(m.id, asset._id) })
    let url = existing?.url
    if (!existing || !(await objectExists(key))) {
      url = (await putObject(key, fs.readFileSync(file), String(asset.mimeType ?? 'application/octet-stream'))).url
      uploaded++
    }
    const meta = (asset.metadata ?? {}) as { dimensions?: { width?: number; height?: number }; lqip?: string }
    const row = {
      id: asset._id,
      url: url!,
      storageKey: key,
      filename: (asset.originalFilename as string | undefined) ?? null,
      mimeType: String(asset.mimeType ?? 'application/octet-stream'),
      size: Number(asset.size ?? fs.statSync(file).size),
      width: meta.dimensions?.width ?? null,
      height: meta.dimensions?.height ?? null,
      blurDataUrl: meta.lqip ?? null,
      sanityAssetId: asset._id,
      legacy: { assetId: asset.assetId, sha1hash: asset.sha1hash, path: asset.path, originalUrl: asset.url },
      createdAt: typeof asset._createdAt === 'string' ? new Date(asset._createdAt) : new Date(),
    }
    mediaById.set(asset._id, row)
  }
  for (const rows of chunk([...mediaById.values()], 100)) {
    await db
      .insert(schema.media)
      .values(rows)
      .onConflictDoUpdate({
        target: schema.media.id,
        set: excludedSet(schema.media, ['url', 'storage_key', 'filename', 'mime_type', 'size', 'width', 'height', 'blur_data_url', 'sanity_asset_id', 'legacy']),
      })
  }
  report.media = { assets: assets.length, uploaded }

  const lookup: MediaLookup = {
    image(assetRef, alt, hotspot) {
      if (!assetRef) return undefined
      const row = mediaById.get(assetRef)
      if (!row) return undefined
      return {
        mediaId: row.id,
        url: row.url,
        ...(alt ? { alt } : {}),
        ...(row.width ? { width: row.width } : {}),
        ...(row.height ? { height: row.height } : {}),
        ...(hotspot ? { focalX: hotspot.x, focalY: hotspot.y } : {}),
        ...(row.blurDataUrl ? { blurDataUrl: row.blurDataUrl } : {}),
      }
    },
  }

  // Images externes des articles (import WordPress) récupérées par l'export
  const externalDir = path.join(snapshotDir, 'external')
  const externalUrls = new Map<string, string>()
  const externalReportFile = path.join(snapshotDir, 'external-images.json')
  if (fs.existsSync(externalReportFile)) {
    for (const entry of JSON.parse(fs.readFileSync(externalReportFile, 'utf8')) as { url: string; file?: string }[]) {
      if (!entry.file) continue
      const key = `external/${externalImageFileName(entry.url)}`
      const ext = path.extname(key).slice(1)
      const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : 'image/jpeg'
      const stored = await putObject(key, fs.readFileSync(path.join(externalDir, entry.file)), type)
      externalUrls.set(entry.url, stored.url)
    }
  }

  // ---------------------------------------------------------------- Comptes
  const adminEmails = new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )
  const studioFile = path.join(snapshotDir, 'studio-members.json')
  const studioMembers = fs.existsSync(studioFile)
    ? (JSON.parse(fs.readFileSync(studioFile, 'utf8')) as { id: string; roles: string[]; isRobot: boolean; email?: string; name?: string }[])
    : []
  for (const member of studioMembers) {
    if (!member.isRobot && member.email) adminEmails.add(member.email)
  }

  const userRows = byType('user').map((doc) => transformUser(doc, lookup, adminEmails))
  const userColumns = [
    'email', 'password_hash', 'first_name', 'last_name', 'user_type', 'account_status', 'oauth_provider', 'oauth_id',
    'linkedin_profile_raw', 'google_profile_raw', 'profile_image', 'cover_image', 'promotion_year', 'city', 'subjects',
    'current_studies', 'linkedin', 'bio', 'description', 'education', 'experience', 'role_association', 'staff_category',
    'staff_details', 'is_visible_in_directory', 'profile_reminder_sent_at', 'legacy', 'created_at', 'updated_at',
  ]
  for (const rows of chunk(userRows, 50)) {
    await db
      .insert(schema.users)
      .values(rows)
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          ...excludedSet(schema.users, userColumns),
          // Ne jamais rétrograder un administrateur lors d'un nouvel import
          role: sql`case when ${schema.users.role} = 'admin' then 'admin' else excluded."role" end`,
        },
      })
  }

  // Comptes du Studio sans compte sur le site : créés administrateurs, sans
  // mot de passe (mot de passe Sanity non récupérable) — à inviter.
  const studioAccounts: { email: string; roles: string[]; created: boolean }[] = []
  for (const member of studioMembers.filter((m) => !m.isRobot && m.email)) {
    const email = member.email!
    const existing = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, email) })
    if (existing) {
      if (existing.role !== 'admin') {
        await db.update(schema.users).set({ role: 'admin', updatedAt: new Date() }).where(sql`${schema.users.id} = ${existing.id}`)
      }
      studioAccounts.push({ email, roles: member.roles, created: false })
      continue
    }
    const [firstName, ...rest] = (member.name ?? email.split('@')[0]).split(' ')
    await db
      .insert(schema.users)
      .values({
        id: `studio-${member.id}`,
        email,
        passwordHash: null,
        firstName: firstName || 'Administrateur',
        lastName: rest.join(' ') || 'Studio',
        userType: 'alumni',
        role: 'admin',
        accountStatus: 'active',
        isVisibleInDirectory: false,
        legacy: { source: 'sanity-studio', sanityUserId: member.id, studioRoles: member.roles },
      })
      .onConflictDoNothing()
    studioAccounts.push({ email, roles: member.roles, created: true })
  }
  report.users = {
    imported: userRows.length,
    withPasswordHash: userRows.filter((u) => u.passwordHash).length,
    admins: userRows.filter((u) => u.role === 'admin').length,
    studioAccounts: studioAccounts.map((a) => ({ roles: a.roles, created: a.created })),
  }

  // ---------------------------------------------------------------- Contenus
  const userIds = new Set(userRows.map((u) => u.id))
  const announcementRows = byType('announcement').map(transformAnnouncement).filter((a) => !a.authorId || userIds.has(a.authorId))
  for (const rows of chunk(announcementRows, 100)) {
    await db.insert(schema.announcements).values(rows).onConflictDoUpdate({
      target: schema.announcements.id,
      set: excludedSet(schema.announcements, ['slug', 'title', 'type', 'event_date', 'company', 'location', 'description', 'contact_email', 'contact_phone', 'external_link', 'author_id', 'published_at', 'expires_at', 'status', 'legacy', 'created_at', 'updated_at']),
    })
  }

  const testimonialRows = byType('testimonial').map((doc) => transformTestimonial(doc, lookup)).filter((t) => !t.authorId || userIds.has(t.authorId))
  for (const rows of chunk(testimonialRows, 100)) {
    await db.insert(schema.testimonials).values(rows).onConflictDoUpdate({
      target: schema.testimonials.id,
      set: excludedSet(schema.testimonials, ['slug', 'title', 'type', 'author_id', 'excerpt', 'featured_image', 'answers', 'tags', 'rating', 'status', 'likes', 'published_at', 'legacy', 'created_at', 'updated_at']),
    })
  }

  const postRows = byType('post').map((doc) => transformPost(doc, lookup, (url) => externalUrls.get(url)))
  for (const rows of chunk(postRows, 50)) {
    await db.insert(schema.posts).values(rows).onConflictDoUpdate({
      target: schema.posts.id,
      // `draft` n'est pas écrasé : un brouillon commencé dans le nouveau site survit à un nouvel import
      set: excludedSet(schema.posts, ['slug', 'status', 'visibility', 'title', 'excerpt', 'body_html', 'main_image', 'published_at', 'legacy', 'created_at', 'updated_at']),
    })
  }

  const newsletterRows = byType('newsletterSubscription').map(transformNewsletter).filter((n) => userIds.has(n.userId))
  for (const rows of chunk(newsletterRows, 100)) {
    await db.insert(schema.newsletterSubscriptions).values(rows).onConflictDoUpdate({
      target: schema.newsletterSubscriptions.id,
      set: excludedSet(schema.newsletterSubscriptions, ['user_id', 'general_newsletter', 'announcements_newsletter', 'subscribed_at', 'updated_at', 'legacy']),
    })
  }

  const tokenRows = await Promise.all(byType('passwordResetToken').map(transformResetToken))
  for (const rows of chunk(tokenRows, 100)) {
    await db.insert(schema.authTokens).values(rows).onConflictDoUpdate({
      target: schema.authTokens.id,
      set: excludedSet(schema.authTokens, ['email', 'token_hash', 'purpose', 'expires_at', 'used_at', 'created_at', 'legacy']),
    })
  }

  const activityRows = byType('activityLog').map(transformActivity).map((a) => ({ ...a, userId: a.userId && userIds.has(a.userId) ? a.userId : null }))
  for (const rows of chunk(activityRows, 500)) {
    await db.insert(schema.activityLogs).values(rows).onConflictDoNothing()
  }

  report.content = {
    announcements: announcementRows.length,
    testimonials: testimonialRows.length,
    posts: postRows.length,
    newsletterSubscriptions: newsletterRows.length,
    resetTokens: tokenRows.length,
    activityLogs: activityRows.length,
  }

  // Pages éditables : textes par défaut (repris des pages en dur) si absents
  report.pages = await seedDefaultContent(db)
  report.skipped = Object.fromEntries(
    Object.entries(
      docs.reduce<Record<string, number>>((acc, doc) => {
        if (doc._type.startsWith('system.')) acc[doc._type] = (acc[doc._type] ?? 0) + 1
        return acc
      }, {})
    )
  )
  return report
}

if (process.argv[1]?.endsWith('import.ts')) {
  runImport(path.resolve(argValue('--snapshot', '.migration/snapshot')))
    .then((report) => {
      console.log(JSON.stringify(report, null, 2))
      process.exit(0)
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.stack : error)
      process.exit(1)
    })
}
