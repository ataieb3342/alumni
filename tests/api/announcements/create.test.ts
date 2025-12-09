import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { resetRateLimitStore } from '@/lib/rate-limit'

// Create mocks using vi.hoisted
const { mockSanityClient, mockAuth } = vi.hoisted(() => ({
  mockSanityClient: {
    fetch: vi.fn(),
    create: vi.fn(),
    patch: vi.fn(),
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

import { POST } from '@/app/api/announcements/create/route'

describe('POST /api/announcements/create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimitStore()
    mockAuth.mockResolvedValue({
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    })
  })

  const validAnnouncementData = {
    title: 'Recherche Développeur Full-Stack',
    type: 'job',
    company: 'Tech Corp',
    location: 'Paris',
    description: 'Nous recherchons un développeur full-stack expérimenté.',
    contactEmail: 'jobs@techcorp.com',
    userId: 'user-123',
  }

  it('creates announcement with valid data', async () => {
    mockSanityClient.create.mockResolvedValue({
      _id: 'announcement-123',
    })

    const request = new NextRequest('http://localhost:3000/api/announcements/create', {
      method: 'POST',
      body: JSON.stringify(validAnnouncementData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.announcementId).toBe('announcement-123')
    expect(mockSanityClient.create).toHaveBeenCalled()
  })

  it('rejects unauthenticated requests', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/announcements/create', {
      method: 'POST',
      body: JSON.stringify(validAnnouncementData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Non authentifié')
    expect(mockSanityClient.create).not.toHaveBeenCalled()
  })

  it('rejects when user tries to create announcement for another user', async () => {
    const request = new NextRequest('http://localhost:3000/api/announcements/create', {
      method: 'POST',
      body: JSON.stringify({
        ...validAnnouncementData,
        userId: 'different-user-id',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Non autorisé')
    expect(mockSanityClient.create).not.toHaveBeenCalled()
  })

  it('rejects announcement without required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/announcements/create', {
      method: 'POST',
      body: JSON.stringify({ ...validAnnouncementData, title: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Le titre doit contenir au moins 3 caractères')
  })
})
