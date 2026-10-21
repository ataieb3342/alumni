import { z } from 'zod'
import { MAX_SUBJECTS, SUBJECT_VALUES } from './subjects'
import { passwordIsValid } from './password-rules'

const PASSWORD_MESSAGE =
  'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)'

/** 12 caractères minimum, majuscule, minuscule, chiffre et caractère spécial parmi @$!%*?& */
export const passwordSchema = z
  .string()
  .min(12, 'Le mot de passe doit contenir au moins 12 caractères')
  .max(200, 'Le mot de passe est trop long')
  .refine(passwordIsValid, PASSWORD_MESSAGE)

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
  password: passwordSchema,
  userType: z.enum(['lyceen', 'bts', 'prepa', 'alumni', 'staff'], {
    message: 'Type d\'utilisateur invalide'
  }),
})

// ========================================
// Schémas de validation pour les annonces
// ========================================

// Mêmes valeurs que le schéma de la base (db/schema.ts) et le formulaire
const ANNOUNCEMENT_TYPES = ['job_offer', 'internship', 'opportunity', 'event', 'school_supplies', 'other'] as const

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
  eventDate: z.string()
    .datetime('Date de l\'événement invalide')
    .optional()
    .or(z.literal('')),
  /** Ignoré : l'auteur est toujours le membre connecté */
  userId: z.string().optional(),
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

/**
 * Liste blanche des champs modifiables via PATCH /api/announcements/[id].
 *
 * Zod retire les clés non déclarées : `author`, `status`, `slug`, `publishedAt`
 * et `_type` ne peuvent donc pas être écrasés par le client.
 *
 * Les champs optionnels acceptent `null` car le formulaire d'édition envoie
 * `formData.champ || null` pour les valeurs vides.
 */
export const patchAnnouncementSchema = z.object({
  title: z.string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(200, 'Le titre est trop long (max 200 caractères)')
    .optional(),
  type: z.enum(ANNOUNCEMENT_TYPES, {
    message: 'Type d\'annonce invalide'
  }).optional(),
  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(5000, 'La description est trop longue (max 5000 caractères)')
    .optional(),
  company: z.string()
    .max(100, 'Le nom de l\'entreprise est trop long')
    .nullish(),
  location: z.string()
    .max(200, 'La localisation est trop longue')
    .nullish(),
  contactEmail: z.union([
    z.string().email('Email de contact invalide'),
    z.literal(''),
    z.null(),
  ]).optional(),
  contactPhone: z.union([
    z.string()
      .regex(/^[\d\s\-\+\(\)]+$/, 'Numéro de téléphone invalide')
      .max(20, 'Numéro de téléphone trop long'),
    z.literal(''),
    z.null(),
  ]).optional(),
  externalLink: z.union([
    z.string().url('URL invalide').max(500, 'URL trop longue'),
    z.literal(''),
    z.null(),
  ]).optional(),
  expiresAt: z.union([
    z.string().datetime('Date d\'expiration invalide'),
    z.literal(''),
    z.null(),
  ]).optional(),
  eventDate: z.union([
    z.string().datetime('Date de l\'événement invalide'),
    z.literal(''),
    z.null(),
  ]).optional(),
})

// ========================================
// Schémas de validation pour les témoignages
// ========================================

const TESTIMONIAL_TYPES = [
  'studies',
  'company',
  'career',
  'international',
  'mentoring',
  'project'
] as const

export const createTestimonialSchema = z.object({
  title: z.string()
    .min(10, 'Le titre doit contenir au moins 10 caractères')
    .max(120, 'Le titre est trop long (max 120 caractères)'),
  type: z.enum(TESTIMONIAL_TYPES, {
    message: 'Type de témoignage invalide'
  }),
  excerpt: z.string()
    .min(50, 'Le résumé doit contenir au moins 50 caractères')
    .max(300, 'Le résumé est trop long (max 300 caractères)'),
  rating: z.coerce.number()
    .int('La note doit être un nombre entier')
    .min(1, 'La note minimale est 1')
    .max(5, 'La note maximale est 5')
    .optional(),
  tags: z.string()
    .max(500, 'Tags trop longs')
    .optional()
    .or(z.literal('')),
  // Champs spécifiques pour "Études & Formation"
  studies_school: z.string().max(200).optional().or(z.literal('')),
  studies_program: z.string().max(200).optional().or(z.literal('')),
  studies_year: z.string().max(100).optional().or(z.literal('')),
  studies_why: z.string().max(2000).optional().or(z.literal('')),
  studies_strengths: z.string().max(2000).optional().or(z.literal('')),
  studies_challenges: z.string().max(2000).optional().or(z.literal('')),
  studies_advice: z.string().max(2000).optional().or(z.literal('')),
  // Champs spécifiques pour "Entreprise & Stage"
  company_name: z.string().max(200).optional().or(z.literal('')),
  company_position: z.string().max(200).optional().or(z.literal('')),
  company_duration: z.string().max(100).optional().or(z.literal('')),
  company_context: z.string().max(200).optional().or(z.literal('')),
  company_missions: z.string().max(2000).optional().or(z.literal('')),
  company_learnings: z.string().max(2000).optional().or(z.literal('')),
  company_how: z.string().max(2000).optional().or(z.literal('')),
  // Champs spécifiques pour "Parcours Professionnel"
  career_journey: z.string().max(2000).optional().or(z.literal('')),
  career_transition: z.string().max(2000).optional().or(z.literal('')),
  career_turning_point: z.string().max(2000).optional().or(z.literal('')),
  career_advice: z.string().max(2000).optional().or(z.literal('')),
  // Champs spécifiques pour "Vie à l'international"
  international_location: z.string().max(200).optional().or(z.literal('')),
  international_duration: z.string().max(100).optional().or(z.literal('')),
  international_why: z.string().max(2000).optional().or(z.literal('')),
  international_daily_life: z.string().max(2000).optional().or(z.literal('')),
  international_best_memory: z.string().max(2000).optional().or(z.literal('')),
  international_challenges: z.string().max(2000).optional().or(z.literal('')),
  // Champs spécifiques pour "Conseil & Mentorat"
  mentoring_topic: z.string().max(200).optional().or(z.literal('')),
  mentoring_context: z.string().max(2000).optional().or(z.literal('')),
  mentoring_advice: z.string().max(3000).optional().or(z.literal('')),
  mentoring_mistakes: z.string().max(2000).optional().or(z.literal('')),
  // Champs spécifiques pour "Projet & Réalisation"
  project_name: z.string().max(200).optional().or(z.literal('')),
  project_description: z.string().max(2000).optional().or(z.literal('')),
  project_role: z.string().max(1000).optional().or(z.literal('')),
  project_challenges: z.string().max(2000).optional().or(z.literal('')),
  project_outcome: z.string().max(2000).optional().or(z.literal('')),
  project_learnings: z.string().max(2000).optional().or(z.literal('')),
})

export const updateTestimonialSchema = createTestimonialSchema.partial().extend({
  id: z.string().min(1, 'ID du témoignage requis'),
})

// ========================================
// Schémas de validation pour les profils
// ========================================

export const updateProfileSchema = z.object({
  /** Ignoré : le profil modifié est toujours celui de la session */
  userId: z.string().optional(),
  firstName: z.string()
    .trim()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom est trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Le prénom contient des caractères invalides')
    .optional(),
  lastName: z.string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom est trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Le nom contient des caractères invalides')
    .optional(),
  promotionYear: z.coerce.number()
    .int('L\'année doit être un nombre entier')
    .min(1950, 'Année invalide')
    .max(new Date().getFullYear() + 10, 'Année invalide')
    .optional()
    .or(z.literal('').transform(() => undefined))
    .or(z.null().transform(() => undefined)),
  currentStudies: z.string()
    .max(200, 'Les études actuelles sont trop longues')
    .optional()
    .or(z.literal('')),
  linkedIn: z.string()
    .trim()
    .max(500, 'URL trop longue')
    .regex(/linkedin\.com/, 'Indiquez l’adresse de votre profil LinkedIn (linkedin.com/in/…)')
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
  city: z.string()
    .trim()
    .max(100, 'Le nom de ville est trop long')
    .optional()
    .or(z.literal('')),
  subjects: z.array(z.enum(SUBJECT_VALUES))
    .max(MAX_SUBJECTS, `${MAX_SUBJECTS} matières maximum`)
    .optional(),
  // Tout champ oublié ici est retiré en silence par Zod avant l'écriture :
  // c'est ainsi que le lieu des expériences disparaissait à chaque enregistrement.
  education: z.array(z.object({
    _key: z.string().max(64).optional(),
    school: z.string().trim().min(1, 'Indiquez l’école').max(200),
    degree: z.string().trim().min(1, 'Indiquez le diplôme').max(200),
    field: z.string().max(200).optional(),
    location: z.string().max(100).optional(),
    startYear: z.number().int().min(1950).max(new Date().getFullYear() + 10),
    endYear: z.number().int().min(1950).max(new Date().getFullYear() + 10).optional(),
    description: z.string().max(1000).optional(),
  })).max(30).optional(),
  experience: z.array(z.object({
    _key: z.string().max(64).optional(),
    company: z.string().trim().min(1, 'Indiquez l’entreprise').max(200),
    position: z.string().trim().min(1, 'Indiquez le poste').max(200),
    location: z.string().max(100).optional(),
    description: z.string().max(1000).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'Date de début invalide'),
    endDate: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'Date de fin invalide').optional(),
    current: z.boolean().optional(),
  })).max(30).optional(),
  /** Identifiant d'un média téléversé par le membre ; null pour retirer la photo */
  profileImageId: z.string().max(64).nullable().optional(),
  coverImageId: z.string().max(64).nullable().optional(),
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
  password: passwordSchema,
})

export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Mot de passe actuel requis'),
  newPassword: passwordSchema,
})
