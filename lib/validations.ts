import { z } from 'zod'

// ========================================
// Schémas de validation pour les utilisateurs
// ========================================

export const registerSchema = z.object({
  firstName: z.string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom est trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Le prénom contient des caractères invalides'),
  lastName: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom est trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Le nom contient des caractères invalides'),
  email: z.string()
    .email('Email invalide')
    .toLowerCase(),
  password: z.string()
    .min(12, 'Le mot de passe doit contenir au moins 12 caractères')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)'
    ),
  userType: z.enum(['lyceen', 'bts', 'prepa', 'alumni', 'staff'], {
    message: 'Type d\'utilisateur invalide'
  }),
})

// ========================================
// Schémas de validation pour les annonces
// ========================================

const ANNOUNCEMENT_TYPES = ['job', 'internship', 'event', 'housing', 'other'] as const

export const createAnnouncementSchema = z.object({
  title: z.string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(200, 'Le titre est trop long (max 200 caractères)'),
  type: z.enum(ANNOUNCEMENT_TYPES, {
    message: 'Type d\'annonce invalide'
  }),
  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(5000, 'La description est trop longue (max 5000 caractères)'),
  company: z.string()
    .max(100, 'Le nom de l\'entreprise est trop long')
    .optional(),
  location: z.string()
    .max(200, 'La localisation est trop longue')
    .optional(),
  contactEmail: z.string()
    .email('Email de contact invalide')
    .optional()
    .or(z.literal('')),
  contactPhone: z.string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Numéro de téléphone invalide')
    .max(20, 'Numéro de téléphone trop long')
    .optional()
    .or(z.literal('')),
  externalLink: z.string()
    .url('URL invalide')
    .max(500, 'URL trop longue')
    .optional()
    .or(z.literal('')),
  expiresAt: z.string()
    .datetime('Date d\'expiration invalide')
    .optional()
    .or(z.literal('')),
  userId: z.string()
    .min(1, 'ID utilisateur requis'),
}).refine(
  (data) => data.contactEmail || data.contactPhone || data.externalLink,
  {
    message: 'Au moins un moyen de contact est requis (email, téléphone ou lien externe)',
    path: ['contactEmail'],
  }
)

export const updateAnnouncementSchema = createAnnouncementSchema.partial().extend({
  id: z.string().min(1, 'ID de l\'annonce requis'),
})

// ========================================
// Schémas de validation pour les témoignages
// ========================================

const TESTIMONIAL_TYPES = [
  'school',
  'university',
  'company',
  'internship',
  'other'
] as const

export const createTestimonialSchema = z.object({
  title: z.string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(200, 'Le titre est trop long (max 200 caractères)'),
  type: z.enum(TESTIMONIAL_TYPES, {
    message: 'Type de témoignage invalide'
  }),
  excerpt: z.string()
    .min(10, 'L\'extrait doit contenir au moins 10 caractères')
    .max(500, 'L\'extrait est trop long (max 500 caractères)'),
  rating: z.coerce.number()
    .int('La note doit être un nombre entier')
    .min(1, 'La note minimale est 1')
    .max(5, 'La note maximale est 5')
    .optional(),
  tags: z.string()
    .max(500, 'Tags trop longs')
    .optional()
    .or(z.literal('')),
  // Champs spécifiques selon le type (on les ajoute dynamiquement)
  schoolName: z.string().max(200).optional(),
  universityName: z.string().max(200).optional(),
  companyName: z.string().max(200).optional(),
  program: z.string().max(200).optional(),
  position: z.string().max(200).optional(),
  duration: z.string().max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const updateTestimonialSchema = createTestimonialSchema.partial().extend({
  id: z.string().min(1, 'ID du témoignage requis'),
})

// ========================================
// Schémas de validation pour les profils
// ========================================

export const updateProfileSchema = z.object({
  userId: z.string()
    .min(1, 'ID utilisateur requis'),
  firstName: z.string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom est trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Le prénom contient des caractères invalides')
    .optional(),
  lastName: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom est trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Le nom contient des caractères invalides')
    .optional(),
  promotionYear: z.coerce.number()
    .int('L\'année doit être un nombre entier')
    .min(1950, 'Année invalide')
    .max(new Date().getFullYear() + 10, 'Année invalide')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  currentStudies: z.string()
    .max(200, 'Les études actuelles sont trop longues')
    .optional()
    .or(z.literal('')),
  linkedIn: z.string()
    .url('URL LinkedIn invalide')
    .max(500, 'URL trop longue')
    .regex(/linkedin\.com/, 'URL LinkedIn invalide')
    .optional()
    .or(z.literal('')),
  bio: z.string()
    .max(1000, 'La biographie est trop longue (max 1000 caractères)')
    .optional()
    .or(z.literal('')),
  isVisibleInDirectory: z.boolean()
    .optional(),
  staffCategory: z.string()
    .max(50, 'La catégorie est trop longue')
    .optional()
    .or(z.literal('')),
  staffDetails: z.string()
    .max(200, 'Les détails du poste sont trop longs')
    .optional()
    .or(z.literal('')),
  education: z.array(z.object({
    school: z.string().max(200),
    degree: z.string().max(200),
    field: z.string().max(200).optional(),
    startYear: z.number().int().min(1950).max(new Date().getFullYear() + 10),
    endYear: z.number().int().min(1950).max(new Date().getFullYear() + 10).optional(),
  })).optional(),
  experience: z.array(z.object({
    company: z.string().max(200),
    position: z.string().max(200),
    description: z.string().max(1000).optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    current: z.boolean().optional(),
  })).optional(),
  profileImageAssetId: z.string()
    .optional(),
  deleteProfileImage: z.boolean()
    .optional(),
  coverImageAssetId: z.string()
    .optional(),
  deleteCoverImage: z.boolean()
    .optional(),
})

// ========================================
// Schémas de validation pour la newsletter
// ========================================

export const subscribeNewsletterSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .toLowerCase(),
  firstName: z.string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom est trop long')
    .optional(),
  lastName: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom est trop long')
    .optional(),
})

// ========================================
// Schémas de validation pour l'authentification
// ========================================

export const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .toLowerCase(),
})

export const resetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Token requis'),
  password: z.string()
    .min(12, 'Le mot de passe doit contenir au moins 12 caractères')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)'
    ),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Mot de passe actuel requis'),
  newPassword: z.string()
    .min(12, 'Le nouveau mot de passe doit contenir au moins 12 caractères')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)'
    ),
})
