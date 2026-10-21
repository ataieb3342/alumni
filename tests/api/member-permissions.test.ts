// @vitest-environment node
/**
 * Les membres ne modifient que ce qui leur appartient ; la modération et les
 * changements de statut restent réservés aux administrateurs. CSRF exigé.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { User } from '@/db/schema'
import { createAnnouncement, getAnnouncementById } from '@/lib/data/announcements'
import { createTestimonial, getTestimonialById } from '@/lib/data/testimonials'
import { getUserById } from '@/lib/data/users'
import { apiRequest, routeParams } from '../helpers/request'
import { createAdmin, createUser, freshDb } from '../helpers/db'
import { authMock, signInAs } from '../helpers/session'

vi.mock('@/lib/auth', () => authMock)
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/notifications', () => ({ notifySubscribers: vi.fn(async () => ({ success: true })) }))
vi.mock('@/lib/emails', () => ({ sendAdminNewUserNotification: vi.fn(async () => ({ success: true })) }))

let author: User
let other: User
let admin: User

const announcementInput = {
  title: 'Stage en laboratoire',
  type: 'internship' as const,
  description: 'Un stage de six mois au laboratoire de physique.',
  contactEmail: 'labo@example.test',
}

describe('Annonces', () => {
  beforeAll(async () => {
    await freshDb()
    author = await createUser()
    other = await createUser()
    admin = await createAdmin()
  })

  it('un membre publie une annonce en son nom, même s’il envoie l’identifiant d’un autre', async () => {
    signInAs(author)
    const { POST } = await import('@/app/api/announcements/create/route')
    const response = await POST(apiRequest('/api/announcements/create', { body: { ...announcementInput, userId: other.id } }), routeParams({}))
    expect(response.status).toBe(200)
    const { announcementId } = await response.json()
    expect((await getAnnouncementById(announcementId))?.authorId).toBe(author.id)
  })

  it('refuse la modification et la suppression par un autre membre (403)', async () => {
    const announcement = await createAnnouncement(author.id, announcementInput)
    signInAs(other)
    const { PATCH, DELETE } = await import('@/app/api/announcements/[id]/route')
    expect((await PATCH(apiRequest('/x', { method: 'PATCH', body: { title: 'Piratée' } }), routeParams({ id: announcement.id }))).status).toBe(403)
    expect((await DELETE(apiRequest('/x', { method: 'DELETE' }), routeParams({ id: announcement.id }))).status).toBe(403)
    expect((await getAnnouncementById(announcement.id))?.title).toBe(announcementInput.title)
  })

  it('l’auteur modifie son annonce, mais pas son statut de modération', async () => {
    const announcement = await createAnnouncement(author.id, announcementInput)
    signInAs(author)
    const { PATCH } = await import('@/app/api/announcements/[id]/route')
    expect((await PATCH(apiRequest('/x', { method: 'PATCH', body: { title: 'Stage en laboratoire (6 mois)' } }), routeParams({ id: announcement.id }))).status).toBe(200)
    expect((await PATCH(apiRequest('/x', { method: 'PATCH', body: { status: 'archived' } }), routeParams({ id: announcement.id }))).status).toBe(403)
    expect((await getAnnouncementById(announcement.id))?.status).toBe('published')
  })

  it('un administrateur modère (statut) et supprime l’annonce d’un membre', async () => {
    const announcement = await createAnnouncement(author.id, announcementInput)
    signInAs(admin)
    const { PATCH, DELETE } = await import('@/app/api/announcements/[id]/route')
    expect((await PATCH(apiRequest('/x', { method: 'PATCH', body: { status: 'archived' } }), routeParams({ id: announcement.id }))).status).toBe(200)
    expect((await getAnnouncementById(announcement.id))?.status).toBe('archived')
    expect((await DELETE(apiRequest('/x', { method: 'DELETE' }), routeParams({ id: announcement.id }))).status).toBe(200)
    expect(await getAnnouncementById(announcement.id)).toBeUndefined()
  })

  it('refuse une écriture sans jeton CSRF ou venant d’un autre site (403)', async () => {
    signInAs(author)
    const { POST } = await import('@/app/api/announcements/create/route')
    expect((await POST(apiRequest('/api/announcements/create', { body: announcementInput, csrf: false }), routeParams({}))).status).toBe(403)
    expect((await POST(apiRequest('/api/announcements/create', { body: announcementInput, origin: 'https://evil.example' }), routeParams({}))).status).toBe(403)
    expect((await POST(apiRequest('/api/announcements/create', { body: announcementInput, origin: null }), routeParams({}))).status).toBe(403)
  })

  it('valide les entrées et indique le champ fautif', async () => {
    signInAs(author)
    const { POST } = await import('@/app/api/announcements/create/route')
    const response = await POST(apiRequest('/api/announcements/create', { body: { ...announcementInput, contactEmail: 'pas-un-email' } }), routeParams({}))
    expect(response.status).toBe(400)
    expect((await response.json()).field).toBe('contactEmail')
  })

  it('refuse un membre suspendu, même avec une session encore valide', async () => {
    const suspended = await createUser({ accountStatus: 'suspended' })
    signInAs(suspended, { accountStatus: 'active' })
    const { POST } = await import('@/app/api/announcements/create/route')
    expect((await POST(apiRequest('/api/announcements/create', { body: announcementInput }), routeParams({}))).status).toBe(403)
  })
})

describe('Témoignages', () => {
  const input = { title: 'Ma prépa à Besançon', type: 'studies' as const, excerpt: 'Deux années intenses, beaucoup de travail et une vraie camaraderie dans la classe.', tags: [], answers: {} }

  it('seul l’auteur (ou un admin) modifie ou supprime', async () => {
    const testimonial = await createTestimonial(author.id, input)
    const { PATCH, DELETE } = await import('@/app/api/testimonials/[id]/route')
    signInAs(other)
    expect((await PATCH(apiRequest('/x', { method: 'PATCH', body: { title: 'Titre modifié par un autre' } }), routeParams({ id: testimonial.id }))).status).toBe(403)
    expect((await DELETE(apiRequest('/x', { method: 'DELETE' }), routeParams({ id: testimonial.id }))).status).toBe(403)
    signInAs(author)
    expect((await PATCH(apiRequest('/x', { method: 'PATCH', body: { studies_why: 'Pour les maths.' } }), routeParams({ id: testimonial.id }))).status).toBe(200)
    expect((await getTestimonialById(testimonial.id))?.answers.studies_why).toBe('Pour les maths.')
    expect((await PATCH(apiRequest('/x', { method: 'PATCH', body: { status: 'draft' } }), routeParams({ id: testimonial.id }))).status).toBe(403)
    signInAs(admin)
    expect((await DELETE(apiRequest('/x', { method: 'DELETE' }), routeParams({ id: testimonial.id }))).status).toBe(200)
  })

  it('l’image de couverture est réservée aux administrateurs, et limitée aux images du site', async () => {
    const testimonial = await createTestimonial(author.id, input)
    const { PATCH } = await import('@/app/api/testimonials/[id]/route')
    const cover = { url: '/media/uploads/couverture.webp', width: 1200, height: 800 }
    signInAs(author)
    expect((await PATCH(apiRequest('/x', { method: 'PATCH', body: { featuredImage: cover } }), routeParams({ id: testimonial.id }))).status).toBe(403)
    signInAs(admin)
    expect((await PATCH(apiRequest('/x', { method: 'PATCH', body: { featuredImage: { url: 'https://evil.example/x.png' } } }), routeParams({ id: testimonial.id }))).status).toBe(400)
    expect((await PATCH(apiRequest('/x', { method: 'PATCH', body: { featuredImage: cover } }), routeParams({ id: testimonial.id }))).status).toBe(200)
    expect((await getTestimonialById(testimonial.id))?.featuredImage).toMatchObject(cover)
    expect((await getTestimonialById(testimonial.id))?.answers).toEqual(testimonial.answers)
    expect((await PATCH(apiRequest('/x', { method: 'PATCH', body: { featuredImage: null } }), routeParams({ id: testimonial.id }))).status).toBe(200)
    expect((await getTestimonialById(testimonial.id))?.featuredImage).toBeNull()
  })
})

describe('Profil et compte', () => {
  it('le profil modifié est toujours celui de la session, quel que soit l’identifiant envoyé', async () => {
    signInAs(other)
    const { POST } = await import('@/app/api/profile/update/route')
    const response = await POST(apiRequest('/api/profile/update', { body: { userId: author.id, city: 'Brest', firstName: 'Usurpé' } }), routeParams({}))
    expect(response.status).toBe(200)
    expect((await getUserById(other.id))?.city).toBe('Brest')
    expect((await getUserById(author.id))?.firstName).not.toBe('Usurpé')
  })

  it('enregistre ville et année malgré des formations et expériences reprises de Sanity', async () => {
    // Forme réelle des données importées : null, année en texte, date ISO complète, LinkedIn en majuscules
    const legacy = await createUser({
      firstName: 'D’Artagnan',
      lastName: 'de Batz',
      linkedIn: 'https://www.LinkedIn.com/in/dartagnan',
      education: [{ school: 'INSA', degree: 'Ingénieur', field: null, location: null, startYear: '2015', endYear: null, description: null }] as never,
      experience: [{ company: 'Acme', position: 'Dev', startDate: '2020-09-01T00:00:00.000Z', endDate: null, current: true }] as never,
    })
    signInAs(legacy)
    const { POST } = await import('@/app/api/profile/update/route')
    const response = await POST(
      apiRequest('/api/profile/update', {
        body: { firstName: legacy.firstName, lastName: legacy.lastName, linkedIn: legacy.linkedIn, promotionYear: '2012', city: 'Lyon', education: legacy.education, experience: legacy.experience },
      }),
      routeParams({})
    )
    expect(response.status).toBe(200)
    const after = await getUserById(legacy.id)
    expect(after?.city).toBe('Lyon')
    expect(after?.promotionYear).toBe(2012)
    expect(after?.education[0]).toMatchObject({ school: 'INSA', startYear: 2015 })
    expect(after?.education[0].endYear).toBeUndefined()
    expect(after?.experience[0].startDate).toBe('2020-09-01')
  })

  it('refuse une image de profil téléversée par quelqu’un d’autre', async () => {
    signInAs(other)
    const { POST } = await import('@/app/api/profile/update/route')
    const response = await POST(apiRequest('/api/profile/update', { body: { profileImageId: 'media-d-un-autre' } }), routeParams({}))
    expect(response.status).toBe(400)
  })

  it('un membre ne peut pas changer son rôle ni son statut via son profil', async () => {
    signInAs(other)
    const { POST } = await import('@/app/api/profile/update/route')
    await POST(apiRequest('/api/profile/update', { body: { role: 'admin', accountStatus: 'active', isVisibleInDirectory: false } }), routeParams({}))
    const after = await getUserById(other.id)
    expect(after?.role).toBe('member')
    expect(after?.isVisibleInDirectory).toBe(false)
  })

  it('la suppression de compte ne supprime que son propre compte, avec ses contenus', async () => {
    const leaving = await createUser()
    const announcement = await createAnnouncement(leaving.id, announcementInput)
    signInAs(leaving)
    const { DELETE } = await import('@/app/api/user/delete/route')
    expect((await DELETE(apiRequest('/api/user/delete', { method: 'DELETE', body: { userId: author.id } }), routeParams({}))).status).toBe(200)
    expect(await getUserById(leaving.id)).toBeUndefined()
    expect(await getUserById(author.id)).toBeDefined()
    expect(await getAnnouncementById(announcement.id)).toBeUndefined()
  })
})

describe('Mesures envoyées par le navigateur', () => {
  it('web vitals : acceptées sans session ni jeton CSRF, mais validées', async () => {
    const { POST } = await import('@/app/api/analytics/web-vitals/route')
    const ok = await POST(apiRequest('/api/analytics/web-vitals', { body: { name: 'LCP', value: 1234, rating: 'good', url: '/accueil' }, csrf: false }), routeParams({}))
    expect(ok.status).toBe(200)
    const bad = await POST(apiRequest('/api/analytics/web-vitals', { body: { name: 'X'.repeat(5000), value: 'nope' }, csrf: false }), routeParams({}))
    expect(bad.status).toBe(400)
  })
})
