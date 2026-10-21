/** Schémas des actions d'administration sur les comptes (partagés avec les formulaires) */
import { z } from 'zod'

const ACCOUNT_STATUSES = ['active', 'pending', 'suspended', 'inactive'] as const
const ROLES = ['member', 'admin'] as const
const USER_TYPES = ['lyceen', 'bts', 'prepa', 'alumni', 'staff'] as const

export const BOARD_ROLES = [
  { value: 'president', label: 'Président(e)' },
  { value: 'vice_president', label: 'Vice-président(e)' },
  { value: 'tresorier', label: 'Trésorier(e)' },
  { value: 'secretaire_general', label: 'Secrétaire général(e)' },
  { value: 'resp_communication', label: 'Responsable communication' },
  { value: 'resp_evenementiel', label: 'Responsable événementiel' },
  { value: 'resp_informatique', label: 'Responsable informatique' },
  { value: 'resp_mailing', label: 'Responsable mailing list' },
  { value: 'pole_communication', label: 'Pôle communication' },
  { value: 'pole_informatique', label: 'Pôle informatique' },
] as const

export const STAFF_CATEGORIES = [
  { value: 'direction', label: 'Direction' },
  { value: 'enseignant', label: 'Enseignant' },
  { value: 'vie_scolaire', label: 'Vie scolaire' },
  { value: 'administratif', label: 'Administratif' },
  { value: 'autre', label: 'Autre' },
] as const

export const adminUserPatchSchema = z.object({
  accountStatus: z.enum(ACCOUNT_STATUSES).optional(),
  role: z.enum(ROLES).optional(),
  userType: z.enum(USER_TYPES).optional(),
  roleAssociation: z.array(z.enum(BOARD_ROLES.map((r) => r.value) as [string, ...string[]])).max(10).optional(),
  isVisibleInDirectory: z.boolean().optional(),
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  promotionYear: z.number().int().min(1950).max(new Date().getFullYear() + 10).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  staffCategory: z.string().max(50).nullable().optional(),
  staffDetails: z.string().max(200).nullable().optional(),
})

export type AdminUserPatch = z.infer<typeof adminUserPatchSchema>

export const adminCreateUserSchema = z.object({
  email: z.string().trim().email('E-mail invalide').max(200),
  firstName: z.string().trim().min(1, 'Prénom requis').max(50),
  lastName: z.string().trim().min(1, 'Nom requis').max(50),
  userType: z.enum(USER_TYPES),
  role: z.enum(ROLES).default('member'),
  sendInvitation: z.boolean().default(true),
})

