/**
 * Vérifie l'import : décomptes type par type (instantané Sanity → base),
 * intégrité des hash de mots de passe, des références et des fichiers.
 * N'affiche aucune donnée personnelle ni aucun hash.
 *
 * Usage : npm run migrate:verify [-- --snapshot .migration/snapshot] [-- --json docs/migration-report.json]
 */
import fs from 'node:fs'
import path from 'node:path'
import { count, eq, isNotNull, sql, type SQL } from 'drizzle-orm'
import { getDb } from '@/db'
import * as schema from '@/db/schema'
import { objectExists } from '@/lib/storage'
import { sha256Hex, type SanityDoc } from './transform'

function argValue(flag: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(flag)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

interface Check {
  type: string
  table: string
  before: number
  after: number
  ok: boolean
  note?: string
}

export async function verify(snapshotDir: string) {
  const db = await getDb()
  const docs: SanityDoc[] = fs
    .readFileSync(path.join(snapshotDir, 'documents.ndjson'), 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line))
  const sanityCount = (type: string) => docs.filter((d) => d._type === type && !d._id.startsWith('drafts.')).length
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableCount = async (table: any, where?: SQL) => {
    const [row] = await db.select({ n: count() }).from(table).where(where)
    return Number(row.n)
  }

  const checks: Check[] = []
  const add = (type: string, table: string, before: number, after: number, note?: string) =>
    checks.push({ type, table, before, after, ok: before === after, note })

  const legacyUsers = await tableCount(schema.users, sql`${schema.users.legacy}->>'_type' = 'user'`)
  add('user', 'users', sanityCount('user'), legacyUsers, 'comptes issus de Sanity (hors comptes Studio créés)')
  add('post', 'posts', sanityCount('post'), await tableCount(schema.posts, sql`${schema.posts.legacy}->>'_type' = 'post'`))
  add('announcement', 'announcements', sanityCount('announcement'), await tableCount(schema.announcements, sql`${schema.announcements.legacy}->>'_type' = 'announcement'`))
  add('testimonial', 'testimonials', sanityCount('testimonial'), await tableCount(schema.testimonials, sql`${schema.testimonials.legacy}->>'_type' = 'testimonial'`))
  add('newsletterSubscription', 'newsletter_subscriptions', sanityCount('newsletterSubscription'), await tableCount(schema.newsletterSubscriptions, sql`${schema.newsletterSubscriptions.legacy}->>'_type' = 'newsletterSubscription'`))
  add('passwordResetToken', 'auth_tokens', sanityCount('passwordResetToken'), await tableCount(schema.authTokens, sql`${schema.authTokens.legacy}->>'_type' = 'passwordResetToken'`))
  const activityIds = new Set(docs.filter((d) => d._type === 'activityLog').map((d) => d._id))
  const importedActivity = (await db.select({ id: schema.activityLogs.id }).from(schema.activityLogs)).filter((r) => activityIds.has(r.id)).length
  add('activityLog', 'activity_logs', activityIds.size, importedActivity)
  add('sanity.imageAsset', 'media', sanityCount('sanity.imageAsset') + sanityCount('sanity.fileAsset'), await tableCount(schema.media, isNotNull(schema.media.sanityAssetId)))

  // Hash de mots de passe : identiques octet pour octet (comparaison d'empreintes)
  const sanityUsers = docs.filter((d) => d._type === 'user')
  const dbUsers = await db.select({ id: schema.users.id, email: schema.users.email, passwordHash: schema.users.passwordHash }).from(schema.users)
  const dbById = new Map(dbUsers.map((u) => [u.id, u]))
  let hashesIdentical = 0
  let hashesMismatch = 0
  let hashesMissing = 0
  for (const user of sanityUsers) {
    const before = typeof user.password === 'string' ? user.password : null
    const after = dbById.get(user._id)?.passwordHash ?? null
    if (before === null && after === null) continue
    if (before !== null && after === null) hashesMissing++
    else if (before !== null && after !== null && (await sha256Hex(before)) === (await sha256Hex(after))) hashesIdentical++
    else hashesMismatch++
  }
  const withPassword = sanityUsers.filter((u) => typeof u.password === 'string').length
  add('user.password (hash bcrypt)', 'users.password_hash', withPassword, hashesIdentical, hashesMismatch || hashesMissing ? `${hashesMismatch} différents, ${hashesMissing} manquants` : 'identiques')

  // E-mails : tous retrouvés (en minuscules)
  const emailsBefore = new Set(sanityUsers.map((u) => String(u.email).toLowerCase()))
  const emailsAfter = new Set(dbUsers.map((u) => u.email))
  const missingEmails = [...emailsBefore].filter((e) => !emailsAfter.has(e)).length
  add('user.email', 'users.email', emailsBefore.size, emailsBefore.size - missingEmails)

  // Rôles et statuts
  const statusBefore = Object.groupBy(sanityUsers, (u) => String(u.accountStatus))
  for (const [status, list] of Object.entries(statusBefore)) {
    add(`user.accountStatus=${status}`, 'users.account_status', list!.length, await tableCount(schema.users, sql`${schema.users.accountStatus} = ${status} and ${schema.users.legacy}->>'_type' = 'user'`))
  }
  const boardBefore = sanityUsers.filter((u) => Array.isArray(u.roleAssociation) && u.roleAssociation.length > 0).length
  add('user.roleAssociation (bureau)', 'users.role_association', boardBefore, await tableCount(schema.users, sql`cardinality(${schema.users.roleAssociation}) > 0`))

  // Références
  const orphanAnnouncements = await tableCount(schema.announcements, sql`${schema.announcements.authorId} is not null and not exists (select 1 from users u where u.id = ${schema.announcements.authorId})`)
  const orphanTestimonials = await tableCount(schema.testimonials, sql`${schema.testimonials.authorId} is not null and not exists (select 1 from users u where u.id = ${schema.testimonials.authorId})`)
  add('références auteur orphelines', 'announcements+testimonials', 0, orphanAnnouncements + orphanTestimonials)

  // Images référencées par les profils, articles, témoignages
  const imageRefs = [
    ...sanityUsers.flatMap((u) => [u.profileImage, u.coverImage]),
    ...docs.filter((d) => d._type === 'post').map((d) => d.mainImage),
    ...docs.filter((d) => d._type === 'testimonial').map((d) => d.featuredImage),
  ].filter((img) => (img as { asset?: unknown } | undefined)?.asset).length
  const imageRefsAfter =
    (await tableCount(schema.users, isNotNull(schema.users.profileImage))) +
    (await tableCount(schema.users, isNotNull(schema.users.coverImage))) +
    (await tableCount(schema.posts, isNotNull(schema.posts.mainImage))) +
    (await tableCount(schema.testimonials, isNotNull(schema.testimonials.featuredImage)))
  add('références d’images', 'users/posts/testimonials', imageRefs, imageRefsAfter)

  // Fichiers présents dans le stockage
  const mediaRows = await db.select({ key: schema.media.storageKey }).from(schema.media).where(isNotNull(schema.media.sanityAssetId))
  let filesPresent = 0
  for (const row of mediaRows) if (await objectExists(row.key)) filesPresent++
  add('fichiers d’images stockés', 'stockage', mediaRows.length, filesPresent)

  const admins = await tableCount(schema.users, eq(schema.users.role, 'admin'))
  const studioCreated = await tableCount(schema.users, sql`${schema.users.legacy}->>'source' = 'sanity-studio'`)
  const skipped = Object.fromEntries(
    [...new Set(docs.map((d) => d._type).filter((t) => t.startsWith('system.')))].map((t) => [t, sanityCount(t)])
  )

  return {
    verifiedAt: new Date().toISOString(),
    database: (process.env.DATABASE_URL ?? 'pglite:./.data/pglite').replace(/\/\/[^@]*@/, '//***@'),
    ok: checks.every((c) => c.ok),
    checks,
    admins,
    studioAccountsCreated: studioCreated,
    skippedSanitySystemDocuments: skipped,
  }
}

if (process.argv[1]?.endsWith('verify.ts')) {
  verify(path.resolve(argValue('--snapshot', '.migration/snapshot')!))
    .then((result) => {
      const width = Math.max(...result.checks.map((c) => c.type.length))
      for (const check of result.checks) {
        console.log(`${check.ok ? '✔' : '✘'} ${check.type.padEnd(width)}  ${String(check.before).padStart(5)} → ${String(check.after).padStart(5)}  ${check.note ?? ''}`)
      }
      console.log(`Administrateurs : ${result.admins} (dont ${result.studioAccountsCreated} créés depuis le Studio)`)
      console.log(`Documents système Sanity non migrés : ${JSON.stringify(result.skippedSanitySystemDocuments)}`)
      const jsonOut = argValue('--json')
      if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(result, null, 2))
      process.exit(result.ok ? 0 : 1)
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.stack : error)
      process.exit(1)
    })
}
