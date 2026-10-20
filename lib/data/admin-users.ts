export { adminCreateUserSchema, adminUserPatchSchema, BOARD_ROLES, STAFF_CATEGORIES } from './admin-users-schema'
/**
 * Actions d'administration sur les comptes (remplacent le Studio Sanity et
 * son webhook de validation).
 */
import type { z } from 'zod'
import { adminCreateUserSchema, type AdminUserPatch } from './admin-users-schema'
import { HttpError } from '@/lib/auth/session'
import { issueToken } from '@/lib/data/tokens'
import { countAdmins, createUser, deleteUser, getUserByEmail, getUserById, updateUser, type User } from '@/lib/data/users'
import { sendUserAccountValidated, sendUserInvitation, sendUserPasswordReset } from '@/lib/emails'
import { logActivity } from '@/lib/activity-logger'

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
