import { apiRoute } from '@/lib/api'
import { adminDeleteUser, adminUpdateUser, adminUserPatchSchema } from '@/lib/data/admin-users'

export const PATCH = apiRoute({ auth: 'admin', body: adminUserPatchSchema }, async ({ params, body, user }) => {
  const { user: updated, emailSent } = await adminUpdateUser(user, params.id, body)
  return { id: updated.id, accountStatus: updated.accountStatus, role: updated.role, emailSent }
})

export const DELETE = apiRoute({ auth: 'admin' }, async ({ params, user }) => {
  await adminDeleteUser(user, params.id)
  return { success: true }
})
