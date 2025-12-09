import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mocks using vi.hoisted
const { mockSendMail, mockLogger } = vi.hoisted(() => ({
  mockSendMail: vi.fn(),
  mockLogger: {
    error: vi.fn(),
  },
}))

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}))

import {
  sendAdminNotificationEmail,
  sendAnnouncementNotificationEmail,
  sendPasswordResetEmail,
} from '@/lib/email'

describe('Email Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.EMAIL_USER = 'test@example.com'
    process.env.EMAIL_PASSWORD = 'password123'
    process.env.ADMIN_EMAIL = 'admin@example.com'
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
    process.env.SANITY_STUDIO_URL = 'https://test.sanity.studio'
  })

  describe('sendAdminNotificationEmail', () => {
    const userData = {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@example.com',
      userType: 'alumni',
      userId: 'user-123',
    }

    it('should send admin notification email successfully', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })

      const result = await sendAdminNotificationEmail(userData)

      expect(result.success).toBe(true)
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Association VH Besançon" <test@example.com>',
          to: 'admin@example.com',
          subject: "Nouvelle demande d'inscription - Action requise",
        })
      )
    })

    it('should include user data in email', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })

      await sendAdminNotificationEmail(userData)

      const call = mockSendMail.mock.calls[0][0]
      expect(call.html).toContain('Jean Dupont')
      expect(call.html).toContain('jean@example.com')
      expect(call.html).toContain('Ancien élève')
      expect(call.text).toContain('Jean Dupont')
    })

    it('should include Sanity URL in email', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })

      await sendAdminNotificationEmail(userData)

      const call = mockSendMail.mock.calls[0][0]
      expect(call.html).toContain('https://test.sanity.studio/structure/user;user-123')
    })

    it('should handle different user types', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })

      const userTypes = [
        { type: 'lyceen', label: 'Lycéen' },
        { type: 'bts', label: 'BTS' },
        { type: 'prepa', label: 'Prépa' },
        { type: 'staff', label: 'Personnel' },
      ]

      for (const { type, label } of userTypes) {
        mockSendMail.mockClear()
        await sendAdminNotificationEmail({ ...userData, userType: type })
        const call = mockSendMail.mock.calls[0][0]
        expect(call.html).toContain(label)
      }
    })

    it('should handle unknown user type', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })

      await sendAdminNotificationEmail({ ...userData, userType: 'unknown' })

      const call = mockSendMail.mock.calls[0][0]
      expect(call.html).toContain('unknown')
    })

    it('should return error on failure', async () => {
      const error = new Error('SMTP error')
      mockSendMail.mockRejectedValue(error)

      const result = await sendAdminNotificationEmail(userData)

      expect(result.success).toBe(false)
      expect(result.error).toBe(error)
    })
  })

  describe('sendAnnouncementNotificationEmail', () => {
    const announcement = {
      title: 'Offre de stage',
      type: 'internship',
      company: 'Tech Corp',
      location: 'Paris',
      slug: 'offre-de-stage-123',
    }

    it('should send announcement notification email successfully', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })

      const result = await sendAnnouncementNotificationEmail(
        'subscriber@example.com',
        'Marie Martin',
        announcement
      )

      expect(result.success).toBe(true)
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Association VH Besançon" <test@example.com>',
          to: 'subscriber@example.com',
          subject: 'Nouvelle annonce : Offre de stage',
        })
      )
    })

    it('should include announcement details in email', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })

      await sendAnnouncementNotificationEmail(
        'subscriber@example.com',
        'Marie Martin',
        announcement
      )

      const call = mockSendMail.mock.calls[0][0]
      expect(call.html).toContain('Marie Martin')
      expect(call.html).toContain('Offre de stage')
      expect(call.html).toContain('Stage')
      expect(call.html).toContain('Tech Corp')
      expect(call.html).toContain('Paris')
      expect(call.html).toContain('http://localhost:3000/annonces/offre-de-stage-123')
    })

    it('should handle announcement without company', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })

      const announcementWithoutCompany = { ...announcement, company: undefined }
      await sendAnnouncementNotificationEmail(
        'subscriber@example.com',
        'Marie Martin',
        announcementWithoutCompany
      )

      expect(mockSendMail).toHaveBeenCalled()
    })

    it('should handle announcement without location', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })

      const announcementWithoutLocation = { ...announcement, location: undefined }
      await sendAnnouncementNotificationEmail(
        'subscriber@example.com',
        'Marie Martin',
        announcementWithoutLocation
      )

      expect(mockSendMail).toHaveBeenCalled()
    })

    it('should handle different announcement types', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })

      const types = [
        { type: 'job', label: "Offre d'emploi" },
        { type: 'event', label: 'Événement' },
        { type: 'other', label: 'Autre' },
      ]

      for (const { type, label } of types) {
        mockSendMail.mockClear()
        await sendAnnouncementNotificationEmail('sub@example.com', 'User', {
          ...announcement,
          type,
        })
        const call = mockSendMail.mock.calls[0][0]
        expect(call.html).toContain(label)
      }
    })

    it('should return error on failure', async () => {
      const error = new Error('SMTP error')
      mockSendMail.mockRejectedValue(error)

      const result = await sendAnnouncementNotificationEmail(
        'subscriber@example.com',
        'Marie Martin',
        announcement
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe(error)
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })

      const result = await sendPasswordResetEmail('user@example.com', 'reset-token-123')

      expect(result.success).toBe(true)
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Association VH Besançon" <test@example.com>',
          to: 'user@example.com',
          subject: 'Réinitialisation de votre mot de passe',
        })
      )
    })

    it('should include reset link in email', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })

      await sendPasswordResetEmail('user@example.com', 'reset-token-123')

      const call = mockSendMail.mock.calls[0][0]
      const expectedUrl =
        'http://localhost:3000/reinitialiser-mot-de-passe?token=reset-token-123'
      expect(call.html).toContain(expectedUrl)
      expect(call.text).toContain(expectedUrl)
    })

    it('should mention expiration time', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })

      await sendPasswordResetEmail('user@example.com', 'reset-token-123')

      const call = mockSendMail.mock.calls[0][0]
      expect(call.html).toContain('1 heure')
      expect(call.text).toContain('1 heure')
    })

    it('should return error on failure', async () => {
      const error = new Error('SMTP error')
      mockSendMail.mockRejectedValue(error)

      const result = await sendPasswordResetEmail('user@example.com', 'reset-token-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe(error)
    })
  })
})
