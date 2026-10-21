/**
 * Change le rôle d'un compte (administrateur / membre), comme
 * /admin/utilisateurs › Nommer administrateur. Le compte doit exister.
 *
 * Usage : npx tsx --env-file=.env.production.local tools/admin/set-role.ts adresse@exemple.fr admin
 */
import { ROLES, type Role } from '@/db/schema'
import { countAdmins, getUserByEmail, normalizeEmail, updateUser } from '@/lib/data/users'
import { logActivity } from '@/lib/activity-logger'

async function main() {
  const email = normalizeEmail(process.argv[2] ?? '')
  const role = process.argv[3] as Role
  if (!email || !ROLES.includes(role)) throw new Error('Usage : set-role.ts <e-mail> <admin|member>')
  const user = await getUserByEmail(email)
  if (!user) throw new Error('Aucun compte avec cette adresse')
  if (user.role === role) {
    console.log(`Rôle déjà « ${role} » : rien à faire.`)
    process.exit(0)
  }
  if (role === 'member' && user.accountStatus === 'active' && (await countAdmins()) <= 1) {
    throw new Error('Refusé : ce compte est le dernier administrateur actif')
  }
  await updateUser(user.id, { role })
  await logActivity({ action: 'admin.user.role', resourceId: user.id, details: `${user.role} → ${role} (tools/admin/set-role.ts)` })
  console.log(`Rôle mis à jour : ${user.role} → ${role} (compte ${user.accountStatus}).`)
  process.exit(0)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
