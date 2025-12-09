import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mocks using vi.hoisted
const { mockSanityClient, mockAuth } = vi.hoisted(() => ({
  mockSanityClient: {
    fetch: vi.fn(),
    create: vi.fn(),
    patch: vi.fn(() => ({
      set: vi.fn(() => ({
        unset: vi.fn(() => ({
          commit: vi.fn().mockResolvedValue({}),
        })),
        commit: vi.fn().mockResolvedValue({}),
      })),
    })),
  },
  mockAuth: vi.fn(),
}))

// Mock dependencies
vi.mock('@/sanity/lib/server-client', () => ({
  serverClient: mockSanityClient,
}))

vi.mock('@/lib/auth', () => ({
  auth: mockAuth,
}))

import { POST } from '@/app/api/profile/update/route'

describe('POST /api/profile/update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    })
    mockSanityClient.fetch.mockResolvedValue({
      _id: 'user-123',
      email: 'test@example.com',
    })
  })

  const validUpdateData = {
    userId: 'user-123',
    firstName: 'Jean',
    lastName: 'Dupont',
    promotionYear: 2020,
    bio: 'Passionné de développement web',
    isVisibleInDirectory: true,
  }

  it('updates profile with valid data', async () => {
    const request = new Request('http://localhost:3000/api/profile/update', {
      method: 'POST',
      body: JSON.stringify(validUpdateData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Profil mis à jour avec succès')
    expect(mockSanityClient.patch).toHaveBeenCalledWith('user-123')
  })

  it('rejects unauthenticated requests', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/profile/update', {
      method: 'POST',
      body: JSON.stringify(validUpdateData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Non authentifié')
  })

  it('rejects when user tries to update another user profile', async () => {
    mockSanityClient.fetch.mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/profile/update', {
      method: 'POST',
      body: JSON.stringify({
        ...validUpdateData,
        userId: 'different-user-id',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Utilisateur non trouvé ou non autorisé')
  })
})
