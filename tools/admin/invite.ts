/**
 * Envoie un lien d'accès à un compte existant, comme le bouton « Envoyer une
 * invitation » de /admin/utilisateurs : invitation (compte sans mot de passe,
 * par ex. administrateur repris du Studio Sanity) ou lien de réinitialisation.
 * Utile quand aucun administrateur ne peut encore se connecter.
 *
 * Usage : EMAIL_TRANSPORT=smtp npx tsx --env-file=.env.production.local tools/admin/invite.ts adresse@exemple.fr
 */
import { getUserByEmail, normalizeEmail } from '@/lib/data/users'
import { issueToken } from '@/lib/data/tokens'
import { sendUserInvitation, sendUserPasswordReset } from '@/lib/emails'
import { logActivity } from '@/lib/activity-logger'
import { emailTransportMode } from '@/lib/emails/config'

async function main() {
  const email = normalizeEmail(process.argv[2] ?? '')
  if (!email) throw new Error('Adresse e-mail manquante')
  const user = await getUserByEmail(email)
  if (!user) throw new Error('Aucun compte avec cette adresse')
  const mode = emailTransportMode()
  if (user.passwordHash) {
    const token = await issueToken(user.email, 'reset')
    const result = await sendUserPasswordReset(user.email, token)
    if (!result.success) throw new Error("L'e-mail n'a pas pu être envoyé")
    await logActivity({ action: 'admin.user.reset_link', resourceId: user.id, details: 'Script tools/admin/invite.ts' })
    console.log(`Lien de réinitialisation envoyé (mode ${mode}).`)
  } else {
    const token = await issueToken(user.email, 'invite')
    const result = await sendUserInvitation({ email: user.email, firstName: user.firstName, token, isAdmin: user.role === 'admin' })
    if (!result.success) throw new Error("L'e-mail n'a pas pu être envoyé")
    await logActivity({ action: 'admin.user.invite', resourceId: user.id, details: 'Script tools/admin/invite.ts' })
    console.log(`Invitation envoyée (mode ${mode}, rôle ${user.role}), valable 7 jours.`)
  }
  process.exit(0)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
