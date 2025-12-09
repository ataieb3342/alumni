import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resetRateLimitStore } from '@/lib/rate-limit'
import { createTestPostRequest } from '../../helpers/request'

// Create mocks using vi.hoisted to avoid hoisting issues
const { mockSanityClient, mockSendAdminNewUserNotification, mockBcryptHash } = vi.hoisted(() => {
  const mockFetch = vi.fn()
  const mockCreate = vi.fn()
  const mockPatch = vi.fn()

  return {
    mockSanityClient: {
      fetch: mockFetch,
      create: mockCreate,
      patch: mockPatch,
    },
    mockSendAdminNewUserNotification: vi.fn().mockResolvedValue(undefined),
    mockBcryptHash: vi.fn().mockResolvedValue('hashed_password_123'),
  }
})

// Mock dependencies
vi.mock('@/sanity/lib/server-client', () => ({
  serverClient: mockSanityClient,
}))

vi.mock('@/lib/emails', () => ({
  sendAdminNewUserNotification: mockSendAdminNewUserNotification,
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: mockBcryptHash,
  },
}))

import { POST } from '@/app/api/auth/register/route'

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimitStore()
    mockSanityClient.fetch.mockResolvedValue(null) // No existing user by default
  })

  const validUserData = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    password: 'SecureP@ssw0rd123',
    userType: 'alumni',
  }

  describe('Successful Registration', () => {
    it('creates a new user with valid data', async () => {
      mockSanityClient.create.mockResolvedValue({
        _id: 'user-new-123',
        ...validUserData,
        accountStatus: 'pending',
      })

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.userId).toBe('user-new-123')
      expect(data.message).toContain('demande d\'inscription a été envoyée')
      expect(mockSanityClient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          _type: 'user',
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@example.com',
          password: 'hashed_password_123',
          userType: 'alumni',
          accountStatus: 'pending',
          isVisibleInDirectory: true,
        })
      )
    })

    it('sends admin notification email on successful registration', async () => {
      mockSanityClient.create.mockResolvedValue({
        _id: 'user-new-123',
      })

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      })

      await POST(request)

      expect(mockSendAdminNewUserNotification).toHaveBeenCalledWith({
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        userType: 'alumni',
        userId: 'user-new-123',
      })
    })

    it('sets isVisibleInDirectory to false for lyceen users', async () => {
      mockSanityClient.create.mockResolvedValue({
        _id: 'user-lyceen-123',
      })

      const lyceanData = { ...validUserData, userType: 'lyceen' as const }
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(lyceanData),
      })

      await POST(request)

      expect(mockSanityClient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isVisibleInDirectory: false,
        })
      )
    })

    it('converts email to lowercase', async () => {
      mockSanityClient.create.mockResolvedValue({
        _id: 'user-new-123',
      })

      const upperCaseEmailData = { ...validUserData, email: 'JEAN.DUPONT@EXAMPLE.COM' }
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(upperCaseEmailData),
      })

      await POST(request)

      expect(mockSanityClient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'jean.dupont@example.com',
        })
      )
    })
  })

  describe('Validation Errors', () => {
    it('rejects registration with short firstName', async () => {
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...validUserData, firstName: 'J' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('prénom doit contenir au moins 2 caractères')
    })

    it('rejects registration with invalid email', async () => {
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...validUserData, email: 'invalid-email' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Email invalide')
    })

    it('rejects registration with weak password (too short)', async () => {
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...validUserData, password: 'Short1!' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('mot de passe doit contenir au moins 12 caractères')
    })

    it('rejects registration with password missing uppercase', async () => {
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...validUserData, password: 'weakpassword1!' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('majuscule')
    })

    it('rejects registration with invalid userType', async () => {
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...validUserData, userType: 'invalid' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Type d\'utilisateur invalide')
    })

    it('rejects firstName with invalid characters', async () => {
      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...validUserData, firstName: 'Jean123' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('caractères invalides')
    })
  })

  describe('Existing User Checks', () => {
    it('rejects registration with existing active user email', async () => {
      mockSanityClient.fetch.mockResolvedValue({
        _id: 'existing-user',
        accountStatus: 'active',
      })

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Cet email est déjà utilisé')
      expect(mockSanityClient.create).not.toHaveBeenCalled()
    })

    it('rejects registration with pending user email', async () => {
      mockSanityClient.fetch.mockResolvedValue({
        _id: 'pending-user',
        accountStatus: 'pending',
      })

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('déjà en cours de validation')
      expect(mockSanityClient.create).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('continues registration even if email notification fails', async () => {
      mockSanityClient.create.mockResolvedValue({
        _id: 'user-new-123',
      })
      mockSendAdminNewUserNotification.mockRejectedValue(new Error('Email failed'))

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('handles database errors gracefully', async () => {
      mockSanityClient.create.mockRejectedValue(new Error('Database error'))

      const request = new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(validUserData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erreur lors de l\'inscription')
    })
  })
})
