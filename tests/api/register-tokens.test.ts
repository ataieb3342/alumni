// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from 'vitest'

const { sendAdminNewUserNotification } = vi.hoisted(() => ({ sendAdminNewUserNotification: vi.fn(async (..._args: unknown[]) => ({ success: true })) }))
vi.mock('@/lib/emails', () => ({ sendAdminNewUserNotification }))
vi.mock('@/lib/auth', async () => (await import('../helpers/session')).authMock)

import { POST as register } from '@/app/api/auth/register/route'
import { getUserByEmail } from '@/lib/data/users'
import { checkToken, consumeToken, issueToken } from '@/lib/data/tokens'
import { apiRequest, routeParams } from '../helpers/request'
import { createUser, freshDb } from '../helpers/db'

const form = (email: string) => ({
  firstName: 'Lou',
  lastName: 'Nouvelle',
  email,
  userType: 'alumni',
  password: 'Nouvelle!2026a',
  confirmPassword: 'Nouvelle!2026a',
})

describe('Inscription', () => {
  beforeAll(async () => {
    await freshDb()
  })

  it('crée un compte en attente et prévient l’administrateur', async () => {
    const response = await register(apiRequest('/api/auth/register', { body: form('Lou.Nouvelle@Example.test') }), routeParams({}))
    expect(response.status).toBe(201)
    const user = await getUserByEmail('lou.nouvelle@example.test')
    expect(user).toMatchObject({ accountStatus: 'pending', role: 'member' })
    expect(sendAdminNewUserNotification).toHaveBeenCalledWith(expect.objectContaining({ email: 'lou.nouvelle@example.test', userId: user!.id }))
  })

  it('refuse un e-mail déjà utilisé, avec un message dédié si la demande est en attente', async () => {
    const pending = await register(apiRequest('/api/auth/register', { body: form('lou.nouvelle@example.test') }), routeParams({}))
    expect(pending.status).toBe(400)
    expect((await pending.json()).error).toMatch(/déjà en cours de validation/)

    const active = await createUser()
    const taken = await register(apiRequest('/api/auth/register', { body: form(active.email) }), routeParams({}))
    expect(taken.status).toBe(400)
    expect((await taken.json()).error).toBe('Cet email est déjà utilisé')
  })

  it('refuse un mot de passe hors politique', async () => {
    const response = await register(apiRequest('/api/auth/register', { body: { ...form('faible@example.test'), password: 'faible', confirmPassword: 'faible' } }), routeParams({}))
    expect(response.status).toBe(400)
    expect(await getUserByEmail('faible@example.test')).toBeUndefined()
  })

  it('limite les tentatives : 5 par minute et par adresse IP', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 7; i++) {
      const response = await register(apiRequest('/api/auth/register', { body: form(`rafale${i}@example.test`), ip: '10.9.9.9' }), routeParams({}))
      statuses.push(response.status)
    }
    expect(statuses.slice(0, 5).every((status) => status === 201)).toBe(true)
    expect(statuses.slice(5)).toEqual([429, 429])
  })
})

describe('Liens de réinitialisation', () => {
  it('un nouveau lien invalide les précédents ; un lien ne sert qu’une fois', async () => {
    const first = await issueToken('Lien@Example.test', 'reset')
    const second = await issueToken('lien@example.test', 'reset')
    expect(await checkToken(first, 'reset')).toEqual({ ok: false, reason: 'invalid' })
    const check = await checkToken(second, 'reset')
    expect(check).toMatchObject({ ok: true, email: 'lien@example.test' })
    expect(await consumeToken((check as { id: string }).id)).toBe(true)
    expect(await checkToken(second, 'reset')).toEqual({ ok: false, reason: 'invalid' })
  })

  it('un lien de réinitialisation ne vaut pas invitation', async () => {
    const token = await issueToken('autre@example.test', 'reset')
    expect(await checkToken(token, 'invite')).toEqual({ ok: false, reason: 'invalid' })
  })
})
