// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { count, eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest'
import { getDb } from '@/db'
import * as schema from '@/db/schema'
import { authorizeCredentials } from '@/lib/auth/credentials'
import { runImport } from '@/tools/migration/import'
import { verify } from '@/tools/migration/verify'
import { freshDb } from '../helpers/db'

/**
 * Instantané Sanity fictif, construit à l'exécution (aucun hash dans le dépôt) :
 * mêmes formes de documents que l'export réel.
 */
const PASSWORD = `Fixture-${Math.random().toString(36).slice(2)}-9a`
let snapshotDir: string

async function writeSnapshot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'alumni-snapshot-'))
  fs.mkdirSync(path.join(dir, 'assets'))
  fs.writeFileSync(path.join(dir, 'assets', 'image-abc123-10x10-png.png'), Buffer.from('fake-png'))
  // Hash au format des comptes d'origine ($2b$, coût 10)
  const legacyHash = (await bcrypt.hash(PASSWORD, 10)).replace(/^\$2a\$/, '$2b$')
  const block = (text: string, extra: Record<string, unknown> = {}) => ({ _type: 'block', _key: text.slice(0, 4), style: 'normal', markDefs: [], children: [{ _type: 'span', text }], ...extra })
  const docs = [
    { _id: 'image-abc123-10x10-png', _type: 'sanity.imageAsset', extension: 'png', mimeType: 'image/png', size: 8, metadata: { dimensions: { width: 10, height: 10 }, lqip: 'data:image/jpeg;base64,AAAA' }, originalFilename: 'photo.png' },
    { _id: 'user-alice', _type: 'user', email: 'Alice.Martin@Example.test', password: legacyHash, firstName: 'Alice', lastName: 'Martin', userType: 'alumni', accountStatus: 'active', promotionYear: 2015, city: 'Lyon', subjects: ['maths', 'matiere-inconnue'], profileImage: { _type: 'image', asset: { _ref: 'image-abc123-10x10-png' }, hotspot: { x: 0.4, y: 0.3 } }, education: [{ _key: 'e1', _type: 'education', degree: 'Master', school: 'INSA' }], roleAssociation: ['president'] },
    { _id: 'user-bob', _type: 'user', email: 'bob@example.test', firstName: 'Bob', lastName: 'Durand', userType: 'teacher', accountStatus: 'pending', oauthProvider: 'google', oauthId: 'g-1' },
    { _id: 'user-claire', _type: 'user', email: 'claire@example.test', password: legacyHash, firstName: 'Claire', lastName: 'Petit', userType: 'student', accountStatus: 'suspended', isVisibleInDirectory: false },
    { _id: 'ann-1', _type: 'announcement', title: 'Stage à Besançon', slug: { current: 'stage-besancon' }, type: 'internship', author: { _ref: 'user-alice' }, description: [block('Missions :'), block('développement', { listItem: 'bullet' })], contactEmail: 'rh@example.test', status: 'published' },
    { _id: 'ann-orpheline', _type: 'announcement', title: 'Auteur supprimé', slug: { current: 'orpheline' }, type: 'other', author: { _ref: 'user-supprime' }, description: [block('Texte')] },
    { _id: 'tem-1', _type: 'testimonial', title: 'Ma prépa', slug: { current: 'ma-prepa' }, type: 'studies', author: { _ref: 'user-alice' }, excerpt: 'Résumé', status: 'published', featuredImage: { asset: { _ref: 'image-abc123-10x10-png' } }, school: 'Lycée VH' },
    { _id: 'post-1', _type: 'post', title: 'Assemblée générale', slug: { current: 'ag' }, visibility: 'members_only', body: [block('Ordre du jour', { style: 'h2' }), block('Bienvenue')], mainImage: { asset: { _ref: 'image-abc123-10x10-png' } }, publishedAt: '2025-09-07T10:00:00Z' },
    { _id: 'drafts.post-1', _type: 'post', title: 'Brouillon Sanity ignoré', slug: { current: 'ag' } },
    { _id: 'news-1', _type: 'newsletterSubscription', user: { _ref: 'user-alice' }, generalNewsletter: true, announcementsNewsletter: false },
    { _id: 'reset-1', _type: 'passwordResetToken', email: 'Alice.Martin@Example.test', token: 'jeton-fictif', expiresAt: '2020-01-01T00:00:00Z', used: true },
    { _id: 'log-1', _type: 'activityLog', user: { _ref: 'user-alice' }, action: 'login', timestamp: '2025-01-01T00:00:00Z' },
    { _id: 'log-2', _type: 'activityLog', user: { _ref: 'user-supprime' }, action: 'login', timestamp: '2025-01-02T00:00:00Z' },
    { _id: 'grp-1', _type: 'system.group', members: [] },
  ]
  fs.writeFileSync(path.join(dir, 'documents.ndjson'), docs.map((doc) => JSON.stringify(doc)).join('\n') + '\n')
  fs.writeFileSync(
    path.join(dir, 'studio-members.json'),
    JSON.stringify([
      { id: 'pStudio1', roles: ['administrator'], isRobot: false, email: 'admin.studio@example.test', name: 'Admin Studio' },
      { id: 'pStudio2', roles: ['editor'], isRobot: false, email: 'bob@example.test', name: 'Bob Durand' },
      { id: 'robot', roles: ['viewer'], isRobot: true },
    ])
  )
  return dir
}

const tableCounts = async () => {
  const db = await getDb()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const n = async (table: any) => Number((await db.select({ n: count() }).from(table))[0].n)
  return {
    users: await n(schema.users),
    media: await n(schema.media),
    announcements: await n(schema.announcements),
    testimonials: await n(schema.testimonials),
    posts: await n(schema.posts),
    newsletter: await n(schema.newsletterSubscriptions),
    tokens: await n(schema.authTokens),
    logs: await n(schema.activityLogs),
    content: await n(schema.contentEntries),
  }
}

describe('Migration Sanity → PostgreSQL', () => {
  let firstCounts: Awaited<ReturnType<typeof tableCounts>>

  beforeAll(async () => {
    await freshDb()
    snapshotDir = await writeSnapshot()
    await runImport(snapshotDir)
    firstCounts = await tableCounts()
  })

  it('importe chaque type de document (brouillons Sanity, orphelins et documents système exclus)', () => {
    expect(firstCounts).toMatchObject({ users: 4, media: 1, announcements: 1, testimonials: 1, posts: 1, newsletter: 1, tokens: 1, logs: 2 })
    expect(firstCounts.content).toBeGreaterThan(0)
  })

  it('recopie les hash de mots de passe tels quels et normalise les e-mails', async () => {
    const db = await getDb()
    const alice = await db.query.users.findFirst({ where: eq(schema.users.id, 'user-alice') })
    expect(alice?.email).toBe('alice.martin@example.test')
    expect(alice?.passwordHash?.startsWith('$2b$10$')).toBe(true)
    expect(alice?.subjects).toEqual(['maths'])
    expect(alice?.profileImage).toMatchObject({ mediaId: 'image-abc123-10x10-png', focalX: 0.4, focalY: 0.3, width: 10 })
    expect(JSON.stringify(alice?.legacy)).not.toContain('$2b$')
  })

  it('crée les comptes du Studio en administrateurs sans mot de passe, et promeut ceux qui existent déjà', async () => {
    const db = await getDb()
    const studio = await db.query.users.findFirst({ where: eq(schema.users.email, 'admin.studio@example.test') })
    expect(studio).toMatchObject({ role: 'admin', passwordHash: null, isVisibleInDirectory: false })
    const bob = await db.query.users.findFirst({ where: eq(schema.users.id, 'user-bob') })
    expect(bob?.role).toBe('admin')
  })

  it('convertit les contenus : annonce en texte, article en HTML avec visibilité « membres »', async () => {
    const db = await getDb()
    const announcement = await db.query.announcements.findFirst({ where: eq(schema.announcements.id, 'ann-1') })
    expect(announcement?.description).toBe('Missions :\n\n• développement')
    const post = await db.query.posts.findFirst({ where: eq(schema.posts.id, 'post-1') })
    expect(post).toMatchObject({ visibility: 'members', title: 'Assemblée générale', bodyHtml: '<h2>Ordre du jour</h2>\n<p>Bienvenue</p>' })
    const log = await db.query.activityLogs.findFirst({ where: eq(schema.activityLogs.id, 'log-2') })
    expect(log?.userId).toBeNull()
  })

  it('la vérification compare les décomptes avant/après sans écart', async () => {
    const result = await verify(snapshotDir)
    expect(result.checks.filter((check) => !check.ok)).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('est idempotent : relancer l’import ne crée aucun doublon et ne perd pas le travail fait depuis', async () => {
    const db = await getDb()
    await db.update(schema.users).set({ role: 'admin' }).where(eq(schema.users.id, 'user-claire'))
    const started = { slug: 'ag', title: 'Brouillon commencé sur le nouveau site', bodyHtml: '<p>…</p>', visibility: 'members' as const, publishedAt: '2025-09-07T10:00:00.000Z' }
    await db.update(schema.posts).set({ draft: started }).where(eq(schema.posts.id, 'post-1'))
    await runImport(snapshotDir)
    expect(await tableCounts()).toEqual(firstCounts)
    const claire = await db.query.users.findFirst({ where: eq(schema.users.id, 'user-claire') })
    expect(claire?.role).toBe('admin')
    const post = await db.query.posts.findFirst({ where: eq(schema.posts.id, 'post-1') })
    expect(post?.draft).toMatchObject({ title: 'Brouillon commencé sur le nouveau site' })
  })

  it('un membre migré se connecte avec son mot de passe d’origine, puis son hash est renforcé', async () => {
    // Coût de production supérieur au coût d'origine (10) : rehash à la connexion
    process.env.BCRYPT_COST = '11'
    onTestFinished(() => {
      process.env.BCRYPT_COST = '4'
    })
    const user = await authorizeCredentials('alice.martin@example.test', PASSWORD, 'migration-test')
    expect(user.id).toBe('user-alice')
    const db = await getDb()
    const alice = await db.query.users.findFirst({ where: eq(schema.users.id, 'user-alice') })
    expect(alice?.passwordHash?.slice(0, 7)).toBe('$2b$11$')
    expect(await bcrypt.compare(PASSWORD, alice!.passwordHash!)).toBe(true)
    await expect(authorizeCredentials('claire@example.test', PASSWORD, 'migration-test')).rejects.toThrow()
  })
})
