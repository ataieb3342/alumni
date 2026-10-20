import { vi } from 'vitest'
import type { User } from '@/db/schema'

/**
 * Simule la session NextAuth renvoyée par `auth()`. À combiner avec :
 *   vi.mock('@/lib/auth', () => authMock)
 */
export const authState: { session: unknown } = { session: null }

export const authMock = {
  auth: vi.fn(async () => authState.session),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
  unstable_update: vi.fn(),
}

/** Connecte un compte ; `tokenOverrides` imite un jeton périmé (rôle ou statut changé depuis) */
export function signInAs(user: User | null, tokenOverrides: Record<string, unknown> = {}) {
  authState.session = user
    ? {
        user: {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          userType: user.userType,
          role: user.role,
          accountStatus: user.accountStatus,
          ...tokenOverrides,
        },
        expires: new Date(Date.now() + 3600_000).toISOString(),
      }
    : null
}
