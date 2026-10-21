import { getDb, resetDbForTests } from '@/db'
import { users, type NewUser } from '@/db/schema'
import { hashPassword } from '@/lib/auth/password'
import { newId } from '@/lib/ids'

/** Base PostgreSQL (PGlite) neuve, migrations appliquées */
export async function freshDb() {
  resetDbForTests()
  return getDb()
}

let counter = 0

export async function createUser(overrides: Partial<NewUser> & { password?: string } = {}) {
  const db = await getDb()
  counter++
  const { password, ...rest } = overrides
  const [user] = await db
    .insert(users)
    .values({
      id: newId(),
      email: `membre${counter}-${newId(6).toLowerCase()}@example.test`,
      firstName: 'Camille',
      lastName: `Test${counter}`,
      userType: 'alumni',
      role: 'member',
      accountStatus: 'active',
      passwordHash: password ? await hashPassword(password) : null,
      ...rest,
    })
    .returning()
  return user
}

export const createAdmin = (overrides: Partial<NewUser> = {}) => createUser({ role: 'admin', ...overrides })
