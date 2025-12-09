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

  it('respects rate limit', async () => {
    mockSanityClient.create.mockResolvedValue({
      _id: 'announcement-123',
    })

    // First 10 requests should succeed (contentCreation preset allows 10 per 5 minutes)
    for (let i = 0; i < 10; i++) {
      const request = new NextRequest('http://localhost:3000/api/announcements/create', {
        method: 'POST',
        body: JSON.stringify(validAnnouncementData),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    }

    // 11th request should be rate limited
    const request = new NextRequest('http://localhost:3000/api/announcements/create', {
      method: 'POST',
      body: JSON.stringify(validAnnouncementData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toContain('Trop de')
  })

  it('handles multiline descriptions with paragraphs', async () => {
    mockSanityClient.create.mockResolvedValue({
      _id: 'announcement-456',
    })

    const multilineDescription = 'First paragraph\n\nSecond paragraph\nWith line break'

    const request = new NextRequest('http://localhost:3000/api/announcements/create', {
      method: 'POST',
      body: JSON.stringify({
        ...validAnnouncementData,
        description: multilineDescription,
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    expect(mockSanityClient.create).toHaveBeenCalled()

    const createCall = mockSanityClient.create.mock.calls[0][0]
    expect(createCall.description[0].children.some((child: { text: string }) => child.text === '\n')).toBe(true)
  })

  it('handles notifications error without failing announcement creation', async () => {
    mockSanityClient.create.mockResolvedValue({
      _id: 'announcement-789',
      title: 'Test Announcement',
      type: 'job',
      slug: { current: 'test-announcement' },
    })

    // Mock notifySubscribers to throw an error
    const mockNotifySubscribers = vi.fn().mockRejectedValue(new Error('Notification error'))
    vi.doMock('@/lib/notifications', () => ({
      notifySubscribers: mockNotifySubscribers,
    }))

    const request = new NextRequest('http://localhost:3000/api/announcements/create', {
      method: 'POST',
      body: JSON.stringify(validAnnouncementData),
    })

    const response = await POST(request)
    const data = await response.json()

    // Announcement should still be created successfully
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('handles server errors during announcement creation', async () => {
    mockSanityClient.create.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/announcements/create', {
      method: 'POST',
      body: JSON.stringify(validAnnouncementData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe("Erreur serveur lors de la création de l'annonce")
  })
})
