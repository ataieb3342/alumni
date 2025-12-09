import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mocks using vi.hoisted
const { mockServerClient, mockSendAnnouncementNotificationEmail, mockLogger } = vi.hoisted(() => ({
  mockServerClient: {
    fetch: vi.fn(),
  },
  mockSendAnnouncementNotificationEmail: vi.fn(),
  mockLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/sanity/lib/server-client', () => ({
  serverClient: mockServerClient,
}))

vi.mock('@/lib/email', () => ({
  sendAnnouncementNotificationEmail: mockSendAnnouncementNotificationEmail,
}))

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}))

import { notifySubscribers } from '@/lib/notifications'

describe('notifySubscribers', () => {
  const mockAnnouncement = {
    _id: 'announcement-123',
    title: 'Nouvelle offre',
    type: 'job',
    company: 'Tech Corp',
    location: 'Paris',
    slug: {
      _type: 'slug',
      current: 'nouvelle-offre-123',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should send notifications to all subscribers', async () => {
    const subscribers = [
      {
        _id: 'sub-1',
        user: {
          _id: 'user-1',
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean@example.com',
        },
      },
      {
        _id: 'sub-2',
        user: {
          _id: 'user-2',
          firstName: 'Marie',
          lastName: 'Martin',
          email: 'marie@example.com',
        },
      },
    ]

    mockServerClient.fetch.mockResolvedValue(subscribers)
    mockSendAnnouncementNotificationEmail.mockResolvedValue({ success: true })

    const result = await notifySubscribers(mockAnnouncement)

    expect(result.success).toBe(true)
    expect(result.sent).toBe(2)
    expect(result.failed).toBe(0)
    expect(result.total).toBe(2)
    expect(mockSendAnnouncementNotificationEmail).toHaveBeenCalledTimes(2)
    expect(mockSendAnnouncementNotificationEmail).toHaveBeenCalledWith(
      'jean@example.com',
      'Jean Dupont',
      {
        title: 'Nouvelle offre',
        type: 'job',
        company: 'Tech Corp',
        location: 'Paris',
        slug: 'nouvelle-offre-123',
      }
    )
  })

  it('should return early if no subscribers', async () => {
    mockServerClient.fetch.mockResolvedValue([])

    const result = await notifySubscribers(mockAnnouncement)

    expect(result.success).toBe(true)
    expect(result.sent).toBe(0)
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Aucun abonné aux notifications d'annonces"
    )
    expect(mockSendAnnouncementNotificationEmail).not.toHaveBeenCalled()
  })

  it('should return early if subscribers is null', async () => {
    mockServerClient.fetch.mockResolvedValue(null)

    const result = await notifySubscribers(mockAnnouncement)

    expect(result.success).toBe(true)
    expect(result.sent).toBe(0)
    expect(mockSendAnnouncementNotificationEmail).not.toHaveBeenCalled()
  })

  it('should filter out subscribers without email', async () => {
    const subscribers = [
      {
        _id: 'sub-1',
        user: {
          _id: 'user-1',
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean@example.com',
        },
      },
      {
        _id: 'sub-2',
        user: {
          _id: 'user-2',
          firstName: 'Marie',
          lastName: 'Martin',
          email: '',
        },
      },
      {
        _id: 'sub-3',
        user: null,
      },
    ]

    mockServerClient.fetch.mockResolvedValue(subscribers)
    mockSendAnnouncementNotificationEmail.mockResolvedValue({ success: true })

    const result = await notifySubscribers(mockAnnouncement)

    expect(result.success).toBe(true)
    expect(result.sent).toBe(1)
    expect(mockSendAnnouncementNotificationEmail).toHaveBeenCalledTimes(1)
  })

  it('should handle partial email failures', async () => {
    const subscribers = [
      {
        _id: 'sub-1',
        user: {
          _id: 'user-1',
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean@example.com',
        },
      },
      {
        _id: 'sub-2',
        user: {
          _id: 'user-2',
          firstName: 'Marie',
          lastName: 'Martin',
          email: 'marie@example.com',
        },
      },
    ]

    mockServerClient.fetch.mockResolvedValue(subscribers)
    mockSendAnnouncementNotificationEmail
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error('Email failed'))

    const result = await notifySubscribers(mockAnnouncement)

    expect(result.success).toBe(true)
    expect(result.sent).toBe(1)
    expect(result.failed).toBe(1)
    expect(result.total).toBe(2)
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "1 email(s) n'ont pas pu être envoyés sur 2"
    )
  })

  it('should handle all email failures', async () => {
    const subscribers = [
      {
        _id: 'sub-1',
        user: {
          _id: 'user-1',
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean@example.com',
        },
      },
    ]

    mockServerClient.fetch.mockResolvedValue(subscribers)
    mockSendAnnouncementNotificationEmail.mockRejectedValue(new Error('Email failed'))

    const result = await notifySubscribers(mockAnnouncement)

    expect(result.success).toBe(true)
    expect(result.sent).toBe(0)
    expect(result.failed).toBe(1)
  })

  it('should handle database fetch errors', async () => {
    const dbError = new Error('Database error')
    mockServerClient.fetch.mockRejectedValue(dbError)

    const result = await notifySubscribers(mockAnnouncement)

    expect(result.success).toBe(false)
    expect(result.error).toBe(dbError)
    expect(mockLogger.error).toHaveBeenCalledWith(
      "Erreur lors de l'envoi des notifications aux abonnés",
      dbError
    )
  })

  it('should log the number of subscribers being notified', async () => {
    const subscribers = [
      {
        _id: 'sub-1',
        user: {
          _id: 'user-1',
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean@example.com',
        },
      },
    ]

    mockServerClient.fetch.mockResolvedValue(subscribers)
    mockSendAnnouncementNotificationEmail.mockResolvedValue({ success: true })

    await notifySubscribers(mockAnnouncement)

    expect(mockLogger.info).toHaveBeenCalledWith(
      "Envoi de notifications à 1 abonné(s) pour l'annonce \"Nouvelle offre\""
    )
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Notifications envoyées : 1 succès, 0 échecs'
    )
  })

  it('should handle announcements without company or location', async () => {
    const announcementWithoutOptionalFields = {
      _id: 'announcement-456',
      title: 'Event',
      type: 'event',
      slug: {
        _type: 'slug',
        current: 'event-456',
      },
    }

    const subscribers = [
      {
        _id: 'sub-1',
        user: {
          _id: 'user-1',
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean@example.com',
        },
      },
    ]

    mockServerClient.fetch.mockResolvedValue(subscribers)
    mockSendAnnouncementNotificationEmail.mockResolvedValue({ success: true })

    const result = await notifySubscribers(announcementWithoutOptionalFields)

    expect(result.success).toBe(true)
    expect(mockSendAnnouncementNotificationEmail).toHaveBeenCalledWith(
      'jean@example.com',
      'Jean Dupont',
      {
        title: 'Event',
        type: 'event',
        company: undefined,
        location: undefined,
        slug: 'event-456',
      }
    )
  })
})
