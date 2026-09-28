import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { mockSanityClient, mockCommit, mockSet, mockSendReminder } = vi.hoisted(() => {
  const mockCommit = vi.fn().mockResolvedValue({})
  const mockSet = vi.fn(() => ({ commit: mockCommit }))
  return {
    mockCommit,
    mockSet,
    mockSanityClient: {
      fetch: vi.fn(),
      patch: vi.fn(() => ({ set: mockSet })),
    },
    mockSendReminder: vi.fn(),
  }
})

vi.mock('@/sanity/lib/server-client', () => ({
  serverClient: mockSanityClient,
}))

vi.mock('@/lib/emails', () => ({
  sendUserProfileReminder: mockSendReminder,
}))

import { GET } from '@/app/api/cron/profile-reminders/route'

const request = (query = '', secret = 'cron-secret') =>
  new NextRequest(`http://localhost:3000/api/cron/profile-reminders${query}`, {
    headers: { authorization: `Bearer ${secret}` },
  })

describe('GET /api/cron/profile-reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'cron-secret'
    mockSendReminder.mockResolvedValue({ success: true })
  })

  it('refuse un appel sans le secret du cron', async () => {
    const response = await GET(request('', 'mauvais-secret'))
    expect(response.status).toBe(401)
    expect(mockSanityClient.fetch).not.toHaveBeenCalled()
  })

  it('refuse tout appel quand le secret n’est pas configuré', async () => {
    delete process.env.CRON_SECRET
    const response = await GET(request('', 'undefined'))
    expect(response.status).toBe(401)
  })

  it('envoie le rappel puis le marque comme envoyé', async () => {
    mockSanityClient.fetch.mockResolvedValue([
      { _id: 'user-1', firstName: 'Camille', email: 'camille@example.com' },
      { _id: 'user-2', firstName: 'Léo', email: 'leo@example.com' },
    ])

    const response = await GET(request())
    const data = await response.json()

    expect(data).toEqual({ sent: 2, failed: 0 })
    expect(mockSendReminder).toHaveBeenCalledWith({ firstName: 'Camille', email: 'camille@example.com' })
    expect(mockSanityClient.patch).toHaveBeenCalledWith('user-1')
    expect(mockSet).toHaveBeenCalledWith({ profileReminderSentAt: expect.any(String) })
    expect(mockCommit).toHaveBeenCalledTimes(2)
  })

  it('ne marque pas un envoi raté, pour le retenter au passage suivant', async () => {
    mockSanityClient.fetch.mockResolvedValue([{ _id: 'user-1', firstName: 'Camille', email: 'camille@example.com' }])
    mockSendReminder.mockResolvedValue({ success: false, error: new Error('SMTP') })

    const data = await (await GET(request())).json()

    expect(data).toEqual({ sent: 0, failed: 1 })
    expect(mockSanityClient.patch).not.toHaveBeenCalled()
  })

  it('ne cible que les profils vides inscrits depuis un mois, jamais relancés', async () => {
    mockSanityClient.fetch.mockResolvedValue([])
    await GET(request())

    const [query, params] = mockSanityClient.fetch.mock.calls[0]
    expect(query).toContain('!defined(profileReminderSentAt)')
    expect(query).toContain('coalesce(count(experience), 0) == 0')
    expect(params).toEqual({ delaySeconds: 30 * 24 * 60 * 60, limit: 40 })
  })

  it('en simulation, compte sans rien envoyer', async () => {
    mockSanityClient.fetch.mockResolvedValue(35)

    const data = await (await GET(request('?dryRun=1'))).json()

    expect(data).toEqual({ dryRun: true, eligible: 35, batchSize: 40 })
    expect(mockSendReminder).not.toHaveBeenCalled()
  })
})
