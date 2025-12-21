import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
  createTestimonialSchema,
  updateTestimonialSchema,
  updateProfileSchema,
  subscribeNewsletterSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '@/lib/validations'

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('devrait valider un utilisateur valide', () => {
      const validUser = {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'Password123!',
        userType: 'alumni',
      }

      const result = registerSchema.safeParse(validUser)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter un prénom trop court', () => {
      const invalidUser = {
        firstName: 'J',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'Password123!',
        userType: 'alumni',
      }

      const result = registerSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('au moins 2 caractères')
      }
    })

    it('devrait rejeter un email invalide', () => {
      const invalidUser = {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'invalid-email',
        password: 'Password123!',
        userType: 'alumni',
      }

      const result = registerSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('devrait rejeter un mot de passe faible', () => {
      const invalidUser = {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'weak',
        userType: 'alumni',
      }

      const result = registerSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('au moins 12 caractères')
      }
    })

    it('devrait rejeter un mot de passe sans majuscule', () => {
      const invalidUser = {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'password123!',
        userType: 'alumni',
      }

      const result = registerSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('devrait rejeter un userType invalide', () => {
      const invalidUser = {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'Password123!',
        userType: 'invalid',
      }

      const result = registerSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })

    it('devrait normaliser l\'email en minuscules', () => {
      const user = {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'Jean.Dupont@EXAMPLE.COM',
        password: 'Password123!',
        userType: 'alumni',
      }

      const result = registerSchema.safeParse(user)
      if (result.success) {
        expect(result.data.email).toBe('jean.dupont@example.com')
      }
    })

    it('devrait rejeter des caractères invalides dans le prénom', () => {
      const invalidUser = {
        firstName: 'Jean123',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'Password123!',
        userType: 'alumni',
      }

      const result = registerSchema.safeParse(invalidUser)
      expect(result.success).toBe(false)
    })
  })

  describe('createAnnouncementSchema', () => {
    it('devrait valider une annonce valide', () => {
      const validAnnouncement = {
        title: 'Offre de stage développeur',
        type: 'internship',
        description: 'Nous recherchons un stagiaire développeur pour rejoindre notre équipe.',
        company: 'Tech Corp',
        location: 'Paris',
        contactEmail: 'contact@techcorp.com',
        userId: 'user123',
      }

      const result = createAnnouncementSchema.safeParse(validAnnouncement)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter un titre trop court', () => {
      const invalidAnnouncement = {
        title: 'AB',
        type: 'job',
        description: 'Description valide',
        contactEmail: 'contact@example.com',
        userId: 'user123',
      }

      const result = createAnnouncementSchema.safeParse(invalidAnnouncement)
      expect(result.success).toBe(false)
    })

    it('devrait rejeter une description trop courte', () => {
      const invalidAnnouncement = {
        title: 'Titre valide',
        type: 'job',
        description: 'Court',
        contactEmail: 'contact@example.com',
        userId: 'user123',
      }

      const result = createAnnouncementSchema.safeParse(invalidAnnouncement)
      expect(result.success).toBe(false)
    })

    it('devrait rejeter un type invalide', () => {
      const invalidAnnouncement = {
        title: 'Titre valide',
        type: 'invalid-type',
        description: 'Description valide et suffisamment longue',
        contactEmail: 'contact@example.com',
        userId: 'user123',
      }

      const result = createAnnouncementSchema.safeParse(invalidAnnouncement)
      expect(result.success).toBe(false)
    })

    it('devrait rejeter un email de contact invalide', () => {
      const invalidAnnouncement = {
        title: 'Titre valide',
        type: 'job',
        description: 'Description valide et suffisamment longue',
        contactEmail: 'invalid-email',
        userId: 'user123',
      }

      const result = createAnnouncementSchema.safeParse(invalidAnnouncement)
      expect(result.success).toBe(false)
    })

    it('devrait rejeter un numéro de téléphone invalide', () => {
      const invalidAnnouncement = {
        title: 'Titre valide',
        type: 'job',
        description: 'Description valide et suffisamment longue',
        contactPhone: 'invalid!!!phone',
        userId: 'user123',
      }

      const result = createAnnouncementSchema.safeParse(invalidAnnouncement)
      expect(result.success).toBe(false)
    })

    it('devrait rejeter sans aucun moyen de contact', () => {
      const invalidAnnouncement = {
        title: 'Titre valide',
        type: 'job',
        description: 'Description valide et suffisamment longue',
        userId: 'user123',
      }

      const result = createAnnouncementSchema.safeParse(invalidAnnouncement)
      expect(result.success).toBe(false)
    })

    it('devrait accepter un numéro de téléphone comme contact', () => {
      const validAnnouncement = {
        title: 'Titre valide',
        type: 'job',
        description: 'Description valide et suffisamment longue',
        contactPhone: '+33 6 12 34 56 78',
        userId: 'user123',
      }

      const result = createAnnouncementSchema.safeParse(validAnnouncement)
      expect(result.success).toBe(true)
    })

    it('devrait accepter un lien externe comme contact', () => {
      const validAnnouncement = {
        title: 'Titre valide',
        type: 'job',
        description: 'Description valide et suffisamment longue',
        externalLink: 'https://example.com/apply',
        userId: 'user123',
      }

      const result = createAnnouncementSchema.safeParse(validAnnouncement)
      expect(result.success).toBe(true)
    })
  })

  describe('createTestimonialSchema', () => {
    it('devrait valider un témoignage valide', () => {
      const validTestimonial = {
        title: 'Mon expérience en études supérieures',
        type: 'studies',
        excerpt: 'Une excellente expérience qui m\'a beaucoup apporté dans ma formation',
        rating: 5,
        studies_school: 'Université de Paris',
      }

      const result = createTestimonialSchema.safeParse(validTestimonial)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter une note supérieure à 5', () => {
      const invalidTestimonial = {
        title: 'Mon expérience',
        type: 'studies',
        excerpt: 'Une bonne expérience globalement',
        rating: 6,
      }

      const result = createTestimonialSchema.safeParse(invalidTestimonial)
      expect(result.success).toBe(false)
    })

    it('devrait rejeter une note inférieure à 1', () => {
      const invalidTestimonial = {
        title: 'Mon expérience',
        type: 'studies',
        excerpt: 'Une bonne expérience globalement',
        rating: 0,
      }

      const result = createTestimonialSchema.safeParse(invalidTestimonial)
      expect(result.success).toBe(false)
    })

    it('devrait convertir une string en number pour le rating', () => {
      const testimonial = {
        title: 'Mon expérience',
        type: 'studies',
        excerpt: 'Une bonne expérience globalement',
        rating: '4',
      }

      const result = createTestimonialSchema.safeParse(testimonial)
      if (result.success) {
        expect(result.data.rating).toBe(4)
        expect(typeof result.data.rating).toBe('number')
      }
    })

    it('devrait rejeter un extrait trop court', () => {
      const invalidTestimonial = {
        title: 'Mon expérience',
        type: 'studies',
        excerpt: 'Court',
      }

      const result = createTestimonialSchema.safeParse(invalidTestimonial)
      expect(result.success).toBe(false)
    })
  })

  describe('updateProfileSchema', () => {
    it('devrait valider un profil valide', () => {
      const validProfile = {
        userId: 'user123',
        firstName: 'Jean',
        lastName: 'Dupont',
        promotionYear: 2020,
        bio: 'Passionné de technologie',
        isVisibleInDirectory: true,
      }

      const result = updateProfileSchema.safeParse(validProfile)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter une année de promotion invalide', () => {
      const invalidProfile = {
        userId: 'user123',
        firstName: 'Jean',
        lastName: 'Dupont',
        promotionYear: 1900,
      }

      const result = updateProfileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
    })

    it('devrait valider une URL LinkedIn correcte', () => {
      const validProfile = {
        userId: 'user123',
        linkedIn: 'https://www.linkedin.com/in/jean-dupont',
      }

      const result = updateProfileSchema.safeParse(validProfile)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter une URL non-LinkedIn', () => {
      const invalidProfile = {
        userId: 'user123',
        linkedIn: 'https://twitter.com/jeandupont',
      }

      const result = updateProfileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
    })

    it('devrait accepter une bio de longueur maximale', () => {
      const validProfile = {
        userId: 'user123',
        bio: 'A'.repeat(1000),
      }

      const result = updateProfileSchema.safeParse(validProfile)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter une bio trop longue', () => {
      const invalidProfile = {
        userId: 'user123',
        bio: 'A'.repeat(1001),
      }

      const result = updateProfileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
    })

    it('devrait transformer une string vide en undefined pour promotionYear', () => {
      const profile = {
        userId: 'user123',
        promotionYear: '',
      }

      const result = updateProfileSchema.safeParse(profile)
      if (result.success) {
        expect(result.data.promotionYear).toBeUndefined()
      }
    })

    it('devrait valider un tableau d\'éducation', () => {
      const validProfile = {
        userId: 'user123',
        education: [
          {
            school: 'Université de Paris',
            degree: 'Master',
            field: 'Informatique',
            startYear: 2018,
            endYear: 2020,
          },
        ],
      }

      const result = updateProfileSchema.safeParse(validProfile)
      expect(result.success).toBe(true)
    })

    it('devrait valider un tableau d\'expérience', () => {
      const validProfile = {
        userId: 'user123',
        experience: [
          {
            company: 'Tech Corp',
            position: 'Développeur',
            description: 'Développement d\'applications web',
            startDate: '2020-01-01',
            endDate: '2021-12-31',
            current: false,
          },
        ],
      }

      const result = updateProfileSchema.safeParse(validProfile)
      expect(result.success).toBe(true)
    })
  })

  describe('forgotPasswordSchema', () => {
    it('devrait valider un email valide', () => {
      const valid = { email: 'user@example.com' }
      const result = forgotPasswordSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter un email invalide', () => {
      const invalid = { email: 'not-an-email' }
      const result = forgotPasswordSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('devrait normaliser l\'email en minuscules', () => {
      const data = { email: 'USER@EXAMPLE.COM' }
      const result = forgotPasswordSchema.safeParse(data)
      if (result.success) {
        expect(result.data.email).toBe('user@example.com')
      }
    })
  })

  describe('resetPasswordSchema', () => {
    it('devrait valider un token et mot de passe valides', () => {
      const valid = {
        token: 'valid-token-string',
        password: 'NewPassword123!',
      }
      const result = resetPasswordSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter un token vide', () => {
      const invalid = {
        token: '',
        password: 'NewPassword123!',
      }
      const result = resetPasswordSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('devrait rejeter un mot de passe faible', () => {
      const invalid = {
        token: 'valid-token',
        password: 'weak',
      }
      const result = resetPasswordSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('changePasswordSchema', () => {
    it('devrait valider des mots de passe valides', () => {
      const valid = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
      }
      const result = changePasswordSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter un nouveau mot de passe faible', () => {
      const invalid = {
        currentPassword: 'OldPassword123!',
        newPassword: 'weak',
      }
      const result = changePasswordSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('subscribeNewsletterSchema', () => {
    it('devrait valider un email valide', () => {
      const valid = {
        email: 'user@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
      }
      const result = subscribeNewsletterSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('devrait accepter uniquement un email', () => {
      const valid = { email: 'user@example.com' }
      const result = subscribeNewsletterSchema.safeParse(valid)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter un email invalide', () => {
      const invalid = { email: 'not-an-email' }
      const result = subscribeNewsletterSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('devrait normaliser l\'email en minuscules', () => {
      const data = { email: 'USER@EXAMPLE.COM' }
      const result = subscribeNewsletterSchema.safeParse(data)
      if (result.success) {
        expect(result.data.email).toBe('user@example.com')
      }
    })
  })
})
