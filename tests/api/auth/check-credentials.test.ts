import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resetRateLimitStore } from '@/lib/rate-limit'
import { createTestPostRequest } from '../../helpers/request'

const { mockSanityClient, mockBcryptCompare } = vi.hoisted(() => ({
  mockSanityClient: {
    fetch: vi.fn(),
  },
  mockBcryptCompare: vi.fn(),
}))

vi.mock('@/sanity/lib/server-client', () => ({
  serverClient: mockSanityClient,
}))

vi.mock('bcryptjs', () => ({
  default: { compare: mockBcryptCompare },
}))

import { POST } from '@/app/api/auth/check-credentials/route'

const URL = 'http://localhost:3000/api/auth/check-credentials'

describe('POST /api/auth/check-credentials', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimitStore()
  })

  describe('Énumération de comptes', () => {
    it('renvoie la même réponse pour un compte inexistant et un mot de passe faux', async () => {
      // Compte inexistant
      mockSanityClient.fetch.mockResolvedValueOnce(null)
      const unknown = await POST(
        createTestPostRequest(URL, { email: 'inconnu@example.com', password: 'Whatever1!' })
      )
      const unknownBody = await unknown.json()

      // Compte existant, mauvais mot de passe
      mockSanityClient.fetch.mockResolvedValueOnce({
        _id: 'user-1',
        email: 'connu@example.com',
        password: 'hash',
        accountStatus: 'active',
      })
      mockBcryptCompare.mockResolvedValueOnce(false)
      const wrongPassword = await POST(
        createTestPostRequest(URL, { email: 'connu@example.com', password: 'Whatever1!' })
      )
      const wrongPasswordBody = await wrongPassword.json()

      expect(unknown.status).toBe(wrongPassword.status)
      expect(unknownBody).toEqual(wrongPasswordBody)
      expect(unknownBody.valid).toBe(false)
      expect(unknownBody.errorType).toBe('invalid_credentials')
    })
  })

  describe('Rate limiting', () => {
    it('renvoie 429 au-delà de 5 tentatives par minute depuis la même IP', async () => {
      mockSanityClient.fetch.mockResolvedValue(null)

      const statuses: number[] = []
      for (let i = 0; i < 6; i++) {
        const response = await POST(
          createTestPostRequest(
            URL,
            { email: `cible${i}@example.com`, password: 'Whatever1!' },
            { ip: '203.0.113.10' }
          )
        )
        statuses.push(response.status)
      }

      expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200])
      expect(statuses[5]).toBe(429)
    })

    it('compte les tentatives par IP', async () => {
      mockSanityClient.fetch.mockResolvedValue(null)

      for (let i = 0; i < 5; i++) {
        await POST(
          createTestPostRequest(URL, { email: 'a@example.com', password: 'x' }, { ip: '203.0.113.20' })
        )
      }

      // Une autre IP ne doit pas être bloquée
      const other = await POST(
        createTestPostRequest(URL, { email: 'a@example.com', password: 'x' }, { ip: '203.0.113.21' })
      )
      expect(other.status).toBe(200)
    })
  })

  describe('Réponses légitimes', () => {
    it('valide des credentials corrects sur un compte actif', async () => {
      mockSanityClient.fetch.mockResolvedValueOnce({
        _id: 'user-1',
        email: 'ok@example.com',
        password: 'hash',
        accountStatus: 'active',
      })
      mockBcryptCompare.mockResolvedValueOnce(true)

      const response = await POST(
        createTestPostRequest(URL, { email: 'ok@example.com', password: 'Correct1!' })
      )
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.valid).toBe(true)
    })

    it('signale un compte en attente seulement après validation du mot de passe', async () => {
      mockSanityClient.fetch.mockResolvedValueOnce({
        _id: 'user-1',
        email: 'attente@example.com',
        password: 'hash',
        accountStatus: 'pending',
      })
      mockBcryptCompare.mockResolvedValueOnce(true)

      const response = await POST(
        createTestPostRequest(URL, { email: 'attente@example.com', password: 'Correct1!' })
      )
      const body = await response.json()

      expect(body.valid).toBe(false)
      expect(body.errorType).toBe('pending_validation')
    })
  })
})
