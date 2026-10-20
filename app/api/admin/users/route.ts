import { NextResponse } from 'next/server'
import { apiRoute } from '@/lib/api'
import { adminCreateUser, adminCreateUserSchema } from '@/lib/data/admin-users'
import { listUsersForAdmin } from '@/lib/data/users'
import { ACCOUNT_STATUSES, ROLES, USER_TYPES, type AccountStatus, type Role, type UserType } from '@/db/schema'

export const GET = apiRoute({ auth: 'admin' }, async ({ req }) => {
  const params = new URL(req.url).searchParams
  const pick = <T extends string>(values: readonly T[], value: string | null) => (value && values.includes(value as T) ? (value as T) : '')
  return listUsersForAdmin({
    q: params.get('q') ?? '',
    status: pick<AccountStatus>(ACCOUNT_STATUSES, params.get('statut')),
    role: pick<Role>(ROLES, params.get('role')),
    type: pick<UserType>(USER_TYPES, params.get('type')),
    page: Number(params.get('page') ?? 1),
  })
})

export const POST = apiRoute({ auth: 'admin', body: adminCreateUserSchema }, async ({ body, user }) => {
  const result = await adminCreateUser(user, body)
  return NextResponse.json({ id: result.user.id, invited: result.invited }, { status: 201 })
})
