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

  it('returns validation error with field path on invalid data', async () => {
    const request = new Request('http://localhost:3000/api/profile/update', {
      method: 'POST',
      body: JSON.stringify({
        ...validUpdateData,
        firstName: '', // Invalid: empty firstName
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
    expect(data.field).toBe('firstName')
  })

  it('updates profile with education data', async () => {
    const request = new Request('http://localhost:3000/api/profile/update', {
      method: 'POST',
      body: JSON.stringify({
        ...validUpdateData,
        education: [
          {
            school: 'Université de Paris',
            degree: 'Master',
            field: 'Informatique',
            startYear: 2018,
            endYear: 2020,
          },
        ],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Profil mis à jour avec succès')
  })

  it('updates profile with experience data', async () => {
    const request = new Request('http://localhost:3000/api/profile/update', {
      method: 'POST',
      body: JSON.stringify({
        ...validUpdateData,
        experience: [
          {
            company: 'Tech Corp',
            position: 'Développeur',
            startDate: '2020-01-01',
            current: true,
          },
        ],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Profil mis à jour avec succès')
  })

  it('updates profile with profile image asset ID', async () => {
    const request = new Request('http://localhost:3000/api/profile/update', {
      method: 'POST',
      body: JSON.stringify({
        ...validUpdateData,
        profileImageAssetId: 'image-asset-123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Profil mis à jour avec succès')
  })

  it('updates profile with cover image asset ID', async () => {
    const request = new Request('http://localhost:3000/api/profile/update', {
      method: 'POST',
      body: JSON.stringify({
        ...validUpdateData,
        coverImageAssetId: 'cover-asset-456',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Profil mis à jour avec succès')
  })

  it('deletes profile image when deleteProfileImage is true', async () => {
    const mockUnset = vi.fn(() => ({
      commit: vi.fn().mockResolvedValue({}),
    }))
    const mockSet = vi.fn(() => ({
      unset: mockUnset,
      commit: vi.fn().mockResolvedValue({}),
    }))
    mockSanityClient.patch.mockReturnValue({
      set: mockSet,
    })

    const request = new Request('http://localhost:3000/api/profile/update', {
      method: 'POST',
      body: JSON.stringify({
        ...validUpdateData,
        deleteProfileImage: true,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Profil mis à jour avec succès')
    expect(mockUnset).toHaveBeenCalledWith(['profileImage'])
  })

  it('deletes cover image when deleteCoverImage is true', async () => {
    const mockUnset = vi.fn(() => ({
      commit: vi.fn().mockResolvedValue({}),
    }))
    const mockSet = vi.fn(() => ({
      unset: mockUnset,
      commit: vi.fn().mockResolvedValue({}),
    }))
    mockSanityClient.patch.mockReturnValue({
      set: mockSet,
    })

    const request = new Request('http://localhost:3000/api/profile/update', {
      method: 'POST',
      body: JSON.stringify({
        ...validUpdateData,
        deleteCoverImage: true,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Profil mis à jour avec succès')
    expect(mockUnset).toHaveBeenCalledWith(['coverImage'])
  })

  it('handles server errors gracefully', async () => {
    mockSanityClient.patch.mockImplementation(() => {
      throw new Error('Database error')
    })

    const request = new Request('http://localhost:3000/api/profile/update', {
      method: 'POST',
      body: JSON.stringify(validUpdateData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erreur lors de la mise à jour du profil')
  })
})
