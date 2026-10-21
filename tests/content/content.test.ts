// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest'
import { CONTENT_DEFAULTS } from '@/lib/content/definitions'
import {
  discardContentDraft,
  getEditableContent,
  getPublishedContent,
  listVersionsForUi,
  publishContent,
  restoreContentVersion,
  saveContentDraft,
} from '@/lib/data/content'
import { createPost, getPostById, listPublishedPosts, publishPost, savePostDraft, unpublishPost, editableContent } from '@/lib/data/posts'
import { seedDefaultContent } from '@/lib/content/seed'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { contentVersions } from '@/db/schema'
import { createAdmin, freshDb } from '../helpers/db'

let adminId: string

describe('Contenus des pages : brouillon et publication', () => {
  beforeAll(async () => {
    await freshDb()
    await seedDefaultContent(await getDb())
    adminId = (await createAdmin()).id
  })

  it('les visiteurs voient la version publiée tant que le brouillon n’est pas publié', async () => {
    const draft = structuredClone(CONTENT_DEFAULTS.home)
    draft.hero.title = 'Titre en brouillon'
    await saveContentDraft('home', draft, adminId)
    expect((await getPublishedContent('home')).hero.title).toBe(CONTENT_DEFAULTS.home.hero.title)
    expect((await getEditableContent('home')).data.hero.title).toBe('Titre en brouillon')
    await publishContent('home', adminId)
    expect((await getPublishedContent('home')).hero.title).toBe('Titre en brouillon')
    expect((await getEditableContent('home')).hasDraft).toBe(false)
  })

  it('assainit le texte riche (scripts, gestionnaires d’événements, liens javascript:)', async () => {
    const draft = structuredClone(CONTENT_DEFAULTS.about)
    draft.story.bodyHtml = '<p onclick="alert(1)">Bonjour<script>alert(1)</script> <a href="javascript:alert(1)">lien</a> <img src="https://evil.example/x.png" onerror="alert(1)"></p>'
    const saved = await saveContentDraft('about', draft, adminId)
    expect(saved.story.bodyHtml).not.toMatch(/script|onclick|onerror|javascript:|evil\.example/)
    expect(saved.story.bodyHtml).toContain('Bonjour')
  })

  it('refuse un contenu invalide (lien dangereux, image externe)', async () => {
    const draft = structuredClone(CONTENT_DEFAULTS.home) as unknown as { hero: { primary: { href: string } } }
    draft.hero.primary.href = 'javascript:alert(1)'
    await expect(saveContentDraft('home', draft, adminId)).rejects.toThrow()
    const withImage = structuredClone(CONTENT_DEFAULTS.home) as unknown as { hero: { image: { url: string } } }
    withImage.hero.image.url = 'https://evil.example/tracker.png'
    await expect(saveContentDraft('home', withImage, adminId)).rejects.toThrow()
  })

  it('garde la version d’origine : on peut revenir au texte d’avant la première modification', async () => {
    const original = (await getPublishedContent('testimonials')).title
    const edited = structuredClone(CONTENT_DEFAULTS.testimonials)
    edited.title = 'Titre modifié'
    await publishContent('testimonials', adminId, edited)
    const versions = await listVersionsForUi('content', 'testimonials')
    const initial = versions.find((v) => v.action === 'initial')
    expect(initial).toBeDefined()
    await restoreContentVersion('testimonials', initial!.id, adminId)
    await publishContent('testimonials', adminId)
    expect((await getPublishedContent('testimonials')).title).toBe(original)
    // Une seule version d'origine, même après plusieurs modifications
    expect((await listVersionsForUi('content', 'testimonials')).filter((v) => v.action === 'initial')).toHaveLength(1)
  })

  it('conserve l’historique et restaure une version dans le brouillon', async () => {
    const first = structuredClone(CONTENT_DEFAULTS.directory)
    first.title = 'Version A'
    await publishContent('directory', adminId, first)
    const second = structuredClone(first)
    second.title = 'Version B'
    await publishContent('directory', adminId, second)
    const versions = await listVersionsForUi('content', 'directory')
    expect(versions.length).toBeGreaterThanOrEqual(2)
    const versionA = (await getDb()).query.contentVersions.findMany()
    const a = (await versionA).find((v) => (v.snapshot as { title?: string }).title === 'Version A')!
    await restoreContentVersion('directory', a.id, adminId)
    expect((await getEditableContent('directory')).data.title).toBe('Version A')
    expect((await getPublishedContent('directory')).title).toBe('Version B')
    await discardContentDraft('directory', adminId)
    expect((await getEditableContent('directory')).data.title).toBe('Version B')
  })
})

describe('Articles du blog', () => {
  it('un nouvel article est un brouillon invisible des visiteurs, jusqu’à sa publication', async () => {
    const post = await createPost({ title: 'Soirée des anciens' }, adminId)
    expect((await listPublishedPosts({ includeMembersOnly: true })).some((p) => p.id === post.id)).toBe(false)
    const content = editableContent((await getPostById(post.id))!)
    await savePostDraft(post.id, { ...content, bodyHtml: '<p>Rendez-vous le 12.</p>' }, adminId)
    await publishPost(post.id, adminId)
    expect((await listPublishedPosts({ includeMembersOnly: false })).some((p) => p.id === post.id)).toBe(true)
  })

  it('les modifications d’un article publié restent invisibles jusqu’à la nouvelle publication', async () => {
    const post = await createPost({ title: 'Article stable' }, adminId)
    await publishPost(post.id, adminId)
    const content = editableContent((await getPostById(post.id))!)
    await savePostDraft(post.id, { ...content, title: 'Titre retravaillé' }, adminId)
    expect((await getPostById(post.id))?.title).toBe('Article stable')
    await publishPost(post.id, adminId)
    expect((await getPostById(post.id))?.title).toBe('Titre retravaillé')
  })

  it('un article importé garde sa version publiée d’origine dans l’historique', async () => {
    const post = await createPost({ title: 'Article importé' }, adminId)
    await publishPost(post.id, adminId)
    const db = await getDb()
    // Simule un article importé de Sanity : publié, sans aucun historique
    await db.delete(contentVersions).where(eq(contentVersions.entityId, post.id))
    const content = editableContent((await getPostById(post.id))!)
    await savePostDraft(post.id, { ...content, title: 'Titre retouché' }, adminId)
    const versions = await listVersionsForUi('post', post.id)
    expect(versions.map((v) => v.action)).toEqual(['save', 'initial'])
  })

  it('les articles « membres » ne sont pas listés pour les visiteurs', async () => {
    const post = await createPost({ title: 'Réservé aux membres' }, adminId)
    const content = editableContent((await getPostById(post.id))!)
    await publishPost(post.id, adminId, { ...content, visibility: 'members' })
    expect((await listPublishedPosts({ includeMembersOnly: false })).some((p) => p.id === post.id)).toBe(false)
    expect((await listPublishedPosts({ includeMembersOnly: true })).some((p) => p.id === post.id)).toBe(true)
  })

  it('retirer un article du site le repasse en brouillon', async () => {
    const post = await createPost({ title: 'À retirer' }, adminId)
    await publishPost(post.id, adminId)
    await unpublishPost(post.id, adminId)
    expect((await getPostById(post.id))?.status).toBe('draft')
  })

  it('refuse une adresse déjà prise', async () => {
    const a = await createPost({ title: 'Même adresse' }, adminId)
    const b = await createPost({ title: 'Autre article' }, adminId)
    const content = editableContent((await getPostById(b.id))!)
    await expect(savePostDraft(b.id, { ...content, slug: (await getPostById(a.id))!.slug }, adminId)).rejects.toThrow(/déjà utilisée/)
  })
})
