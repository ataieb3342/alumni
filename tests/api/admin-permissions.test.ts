// @vitest-environment node
/**
 * Toute route d'administration refuse un visiteur (401) et un membre (403),
 * même appelée directement, sans passer par l'interface.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'
import type { User } from '@/db/schema'
import { apiRequest, routeParams } from '../helpers/request'
import { createAdmin, createUser, freshDb } from '../helpers/db'
import { authMock, signInAs } from '../helpers/session'

vi.mock('@/lib/auth', () => authMock)
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('@/lib/emails', () => ({
  sendUserAccountValidated: vi.fn(async () => ({ success: true })),
  sendUserInvitation: vi.fn(async () => ({ success: true })),
  sendUserPasswordReset: vi.fn(async () => ({ success: true })),
  sendAdminNewUserNotification: vi.fn(async () => ({ success: true })),
}))

type Handler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>

let member: User
let admin: User
let target: User
let promotee: User

const tinyPng = () => {
  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
  const form = new FormData()
  form.append('file', new File([bytes], 'pixel.png', { type: 'image/png' }))
  return form
}

interface Case {
  name: string
  load: () => Promise<Record<string, Handler>>
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  params?: () => Record<string, string>
  body?: () => unknown
  formData?: () => FormData
}

const cases: Case[] = [
  { name: 'enregistrer le brouillon d’une page', load: () => import('@/app/api/admin/content/[key]/draft/route'), method: 'PUT', path: '/api/admin/content/home/draft', params: () => ({ key: 'home' }), body: () => ({}) },
  { name: 'abandonner le brouillon d’une page', load: () => import('@/app/api/admin/content/[key]/draft/route'), method: 'DELETE', path: '/api/admin/content/home/draft', params: () => ({ key: 'home' }) },
  { name: 'publier une page', load: () => import('@/app/api/admin/content/[key]/publish/route'), method: 'POST', path: '/api/admin/content/home/publish', params: () => ({ key: 'home' }) },
  { name: 'lire l’historique d’une page', load: () => import('@/app/api/admin/content/[key]/versions/route'), method: 'GET', path: '/api/admin/content/home/versions', params: () => ({ key: 'home' }) },
  { name: 'restaurer une version', load: () => import('@/app/api/admin/content/[key]/versions/[versionId]/restore/route'), method: 'POST', path: '/api/admin/content/home/versions/x/restore', params: () => ({ key: 'home', versionId: 'x' }) },
  { name: 'créer un article', load: () => import('@/app/api/admin/posts/route'), method: 'POST', path: '/api/admin/posts', body: () => ({ title: 'Piratage' }) },
  { name: 'supprimer un article', load: () => import('@/app/api/admin/posts/[id]/route'), method: 'DELETE', path: '/api/admin/posts/x', params: () => ({ id: 'x' }) },
  { name: 'enregistrer un article', load: () => import('@/app/api/admin/posts/[id]/draft/route'), method: 'PUT', path: '/api/admin/posts/x/draft', params: () => ({ id: 'x' }), body: () => ({}) },
  { name: 'publier un article', load: () => import('@/app/api/admin/posts/[id]/publish/route'), method: 'POST', path: '/api/admin/posts/x/publish', params: () => ({ id: 'x' }) },
  { name: 'dépublier un article', load: () => import('@/app/api/admin/posts/[id]/unpublish/route'), method: 'POST', path: '/api/admin/posts/x/unpublish', params: () => ({ id: 'x' }) },
  { name: 'téléverser dans la médiathèque', load: () => import('@/app/api/admin/media/route'), method: 'POST', path: '/api/admin/media', formData: tinyPng },
  { name: 'lister la médiathèque', load: () => import('@/app/api/admin/media/route'), method: 'GET', path: '/api/admin/media' },
  { name: 'supprimer un média', load: () => import('@/app/api/admin/media/[id]/route'), method: 'DELETE', path: '/api/admin/media/x', params: () => ({ id: 'x' }) },
  { name: 'lister les comptes', load: () => import('@/app/api/admin/users/route'), method: 'GET', path: '/api/admin/users' },
  { name: 'créer un compte', load: () => import('@/app/api/admin/users/route'), method: 'POST', path: '/api/admin/users', body: () => ({ email: 'pirate@example.test', firstName: 'P', lastName: 'P', userType: 'alumni', role: 'admin' }) },
  { name: 'nommer un administrateur', load: () => import('@/app/api/admin/users/[id]/route'), method: 'PATCH', path: '/api/admin/users/x', params: () => ({ id: promotee.id }), body: () => ({ role: 'admin' }) },
  { name: 'valider un compte', load: () => import('@/app/api/admin/users/[id]/route'), method: 'PATCH', path: '/api/admin/users/x', params: () => ({ id: target.id }), body: () => ({ accountStatus: 'active' }) },
  { name: 'supprimer un compte', load: () => import('@/app/api/admin/users/[id]/route'), method: 'DELETE', path: '/api/admin/users/x', params: () => ({ id: target.id }) },
  { name: 'envoyer une invitation', load: () => import('@/app/api/admin/users/[id]/invite/route'), method: 'POST', path: '/api/admin/users/x/invite', params: () => ({ id: target.id }) },
  { name: 'lire les statistiques', load: () => import('@/app/api/admin/stats/route'), method: 'GET', path: '/api/admin/stats' },
  { name: 'exporter les abonnés', load: () => import('@/app/api/admin/newsletter/export/route'), method: 'GET', path: '/api/admin/newsletter/export' },
  { name: 'synchroniser Google Drive', load: () => import('@/app/api/admin/newsletter/sync-drive/route'), method: 'POST', path: '/api/admin/newsletter/sync-drive' },
]

async function call(test: Case) {
  const handlers = await test.load()
  const handler = handlers[test.method]
  return handler(apiRequest(test.path, { method: test.method, body: test.body?.(), formData: test.formData?.() }), routeParams(test.params?.() ?? {}))
}

describe('Routes d’administration', () => {
  beforeAll(async () => {
    await freshDb()
    member = await createUser()
    admin = await createAdmin()
    target = await createUser({ accountStatus: 'pending' })
    promotee = await createUser()
  })

  describe.each(cases)('$name', (test) => {
    it('refuse un visiteur non connecté (401)', async () => {
      signInAs(null)
      expect((await call(test)).status).toBe(401)
    })

    it('refuse un membre (403)', async () => {
      signInAs(member)
      expect((await call(test)).status).toBe(403)
    })

    it('refuse un membre dont le jeton prétend être admin (rôle relu en base)', async () => {
      signInAs(member, { role: 'admin' })
      expect((await call(test)).status).toBe(403)
    })

    it('laisse passer un administrateur', async () => {
      signInAs(admin)
      const response = await call(test)
      expect([401, 403]).not.toContain(response.status)
    })
  })

  it('un membre ne peut pas se nommer lui-même administrateur', async () => {
    signInAs(member)
    const { PATCH } = await import('@/app/api/admin/users/[id]/route')
    const response = await PATCH(apiRequest('/api/admin/users/x', { method: 'PATCH', body: { role: 'admin' } }), routeParams({ id: member.id }))
    expect(response.status).toBe(403)
    const { getUserById } = await import('@/lib/data/users')
    expect((await getUserById(member.id))?.role).toBe('member')
  })
})

describe('Comptes administrateurs révoqués', () => {
  it('un administrateur rétrogradé perd l’accès immédiatement, malgré son jeton', async () => {
    await freshDb()
    const former = await createUser({ role: 'member' })
    signInAs(former, { role: 'admin' })
    const { GET } = await import('@/app/api/admin/users/route')
    expect((await GET(apiRequest('/api/admin/users'), routeParams({}))).status).toBe(403)
  })

  it('un administrateur suspendu perd l’accès', async () => {
    const suspended = await createAdmin({ accountStatus: 'suspended' })
    signInAs(suspended, { accountStatus: 'active' })
    const { GET } = await import('@/app/api/admin/users/route')
    expect((await GET(apiRequest('/api/admin/users'), routeParams({}))).status).toBe(403)
  })

  it('le dernier administrateur ne peut pas se retirer le rôle', async () => {
    await freshDb()
    const only = await createAdmin()
    signInAs(only)
    const { PATCH } = await import('@/app/api/admin/users/[id]/route')
    const response = await PATCH(apiRequest('/api/admin/users/x', { method: 'PATCH', body: { role: 'member' } }), routeParams({ id: only.id }))
    expect(response.status).toBe(409)
  })
})
