/**
 * Actions d'administration sur les comptes (remplacent le Studio Sanity et
 * son webhook de validation).
 */
import { z } from 'zod'
import { ACCOUNT_STATUSES, ROLES, USER_TYPES } from '@/db/schema'
import { HttpError } from '@/lib/auth/session'
import { issueToken } from '@/lib/data/tokens'
import { countAdmins, createUser, deleteUser, getUserByEmail, getUserById, updateUser, type User } from '@/lib/data/users'
import { sendUserAccountValidated, sendUserInvitation, sendUserPasswordReset } from '@/lib/emails'
import { logActivity } from '@/lib/activity-logger'

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

export async function adminUpdateUser(actor: User, id: string, patch: AdminUserPatch) {
  const target = await getUserById(id)
  if (!target) throw new HttpError(404, 'Compte introuvable')

  const losesAdmin =
    target.role === 'admin' &&
    ((patch.role && patch.role !== 'admin') || (patch.accountStatus && patch.accountStatus !== 'active'))
  if (losesAdmin && (await countAdmins()) <= 1) {
    throw new HttpError(409, 'Il doit rester au moins un administrateur actif')
  }
  if (target.id === actor.id && patch.accountStatus && patch.accountStatus !== 'active') {
    throw new HttpError(409, 'Vous ne pouvez pas désactiver votre propre compte')
  }

  const updated = await updateUser(id, patch)

  // Ancien webhook Sanity : e-mail « compte validé » au passage à actif
  let emailSent: boolean | undefined
  if (patch.accountStatus === 'active' && target.accountStatus !== 'active') {
    const result = await sendUserAccountValidated({ firstName: updated.firstName, lastName: updated.lastName, email: updated.email })
    emailSent = result.success
  }
  await logActivity({
    userId: actor.id,
    action: 'admin.user.update',
    resourceId: id,
    details: Object.keys(patch).join(', '),
  })
  return { user: updated, emailSent }
}

export async function adminDeleteUser(actor: User, id: string) {
  const target = await getUserById(id)
  if (!target) throw new HttpError(404, 'Compte introuvable')
  if (target.id === actor.id) throw new HttpError(409, 'Supprimez votre propre compte depuis vos paramètres')
  if (target.role === 'admin' && (await countAdmins()) <= 1) throw new HttpError(409, 'Il doit rester au moins un administrateur actif')
  await deleteUser(id)
  await logActivity({ userId: actor.id, action: 'admin.user.delete', resourceId: id, details: target.email })
}

/**
 * Envoie un lien pour choisir un mot de passe : invitation (compte sans mot
 * de passe, par exemple un administrateur repris du Studio) ou réinitialisation.
 */
export async function adminSendAccessLink(actor: User, id: string) {
  const target = await getUserById(id)
  if (!target) throw new HttpError(404, 'Compte introuvable')
  if (target.passwordHash) {
    const token = await issueToken(target.email, 'reset')
    const result = await sendUserPasswordReset(target.email, token)
    if (!result.success) throw new HttpError(502, "L'e-mail n'a pas pu être envoyé")
    await logActivity({ userId: actor.id, action: 'admin.user.reset_link', resourceId: id })
    return { kind: 'reset' as const }
  }
  const token = await issueToken(target.email, 'invite')
  const result = await sendUserInvitation({ email: target.email, firstName: target.firstName, token, isAdmin: target.role === 'admin' })
  if (!result.success) throw new HttpError(502, "L'e-mail n'a pas pu être envoyé")
  await logActivity({ userId: actor.id, action: 'admin.user.invite', resourceId: id })
  return { kind: 'invite' as const }
}

export const adminCreateUserSchema = z.object({
  email: z.string().trim().email('E-mail invalide').max(200),
  firstName: z.string().trim().min(1, 'Prénom requis').max(50),
  lastName: z.string().trim().min(1, 'Nom requis').max(50),
  userType: z.enum(USER_TYPES),
  role: z.enum(ROLES).default('member'),
  sendInvitation: z.boolean().default(true),
})

/** Création d'un compte par un administrateur : actif, sans mot de passe, invité par e-mail */
export async function adminCreateUser(actor: User, input: z.infer<typeof adminCreateUserSchema>) {
  if (await getUserByEmail(input.email)) throw new HttpError(409, 'Un compte existe déjà avec cet e-mail', 'email')
  const user = await createUser({ ...input, accountStatus: 'active' })
  await logActivity({ userId: actor.id, action: 'admin.user.create', resourceId: user.id, details: input.role })
  let invited = false
  if (input.sendInvitation) {
    invited = (await adminSendAccessLink(actor, user.id).then(() => true).catch(() => false))
  }
  return { user, invited }
}
