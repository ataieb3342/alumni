import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock auth function
vi.mock('@/lib/auth', () => ({
  auth: vi.fn((handler: any) => handler),
}))

// `auth()` est typé `(req, ctx) => void | Response` par NextAuth, alors que le
// mock ci-dessus renvoie le handler nu, appelable avec la seule requête.
// Ce helper porte la signature réellement exercée par les tests.
type TestMiddleware = (req: unknown) => Promise<Response> | Response

async function loadMiddleware(): Promise<TestMiddleware> {
  const mod = await import('@/middleware')
  return mod.default as unknown as TestMiddleware
}

// Helper to create mock requests
function createMockRequest(pathname: string, session?: any) {
  const request = {
    nextUrl: {
      pathname,
    },
    url: `http://localhost:3000${pathname}`,
    auth: session,
    headers: {
      get: vi.fn(() => null), // Mock headers.get pour correlation ID
    },
  } as any

  return request
}

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Public Routes', () => {
    const publicRoutes = [
      '/',
      '/connexion',
      '/inscription',
      '/mot-de-passe-oublie',
      '/reinitialiser-mot-de-passe',
      '/validation-en-cours',
      '/a-propos',
      '/politique-confidentialite',
      '/mentions-legales',
    ]

    it.each(publicRoutes)('allows access to %s without authentication', async (route) => {
      const middleware = await loadMiddleware()
      const req = createMockRequest(route, null)
      const response = await middleware(req)

      // Should not redirect (either next() or allow access)
      expect(response.headers.get('location')).toBeNull()
    })

    it('allows access to nested public routes', async () => {
      const middleware = await loadMiddleware()
      const req = createMockRequest('/a-propos/team', null)
      const response = await middleware(req)

      expect(response.headers.get('location')).toBeNull()
    })
  })

  describe('Public API Routes', () => {
    const publicApiRoutes = [
      '/api/auth/signin',
      '/api/auth/signout',
      '/api/auth/register',
      '/api/webhooks/sanity',
      '/api/cron/cleanup',
    ]

    it.each(publicApiRoutes)('allows access to %s without authentication', async (route) => {
      const middleware = await loadMiddleware()
      const req = createMockRequest(route, null)
      const response = await middleware(req)

      expect(response.status).not.toBe(307) // Not a redirect
    })
  })

  describe('Temporary OAuth Users', () => {
    it('redirects temp user trying to access protected route to /choisir-type', async () => {
      const middleware = await loadMiddleware()
      const session = {
        user: {
          id: 'temp-123456',
          email: 'test@example.com',
        },
      }

      const req = createMockRequest('/tableau-de-bord', session)
      const response = await middleware(req)

      expect(response.status).toBe(307)
      const location = response.headers.get('location')
      expect(location).toContain('/choisir-type')
    })

    it('allows temp user to access /choisir-type', async () => {
      const middleware = await loadMiddleware()
      const session = {
        user: {
          id: 'temp-123456',
          email: 'test@example.com',
        },
      }

      const req = createMockRequest('/choisir-type', session)
      const response = await middleware(req)

      expect(response.headers.get('location')).toBeNull()
    })

    it('allows temp user to access auth API routes', async () => {
      const middleware = await loadMiddleware()
      const session = {
        user: {
          id: 'temp-123456',
          email: 'test@example.com',
        },
      }

      const req = createMockRequest('/api/auth/update-user-type', session)
      const response = await middleware(req)

      expect(response.status).not.toBe(307)
    })
  })

  describe('Pending Account Status', () => {
    it('redirects pending user to /validation-en-cours when accessing protected route', async () => {
      const middleware = await loadMiddleware()
      const session = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          accountStatus: 'pending',
        },
      }

      const req = createMockRequest('/tableau-de-bord', session)
      const response = await middleware(req)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/validation-en-cours')
    })

    it('allows pending user to access /validation-en-cours', async () => {
      const middleware = await loadMiddleware()
      const session = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          accountStatus: 'pending',
        },
      }

      const req = createMockRequest('/validation-en-cours', session)
      const response = await middleware(req)

      expect(response.headers.get('location')).toBeNull()
    })

    it('allows pending user to access public routes', async () => {
      const middleware = await loadMiddleware()
      const session = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          accountStatus: 'pending',
        },
      }

      const req = createMockRequest('/a-propos', session)
      const response = await middleware(req)

      expect(response.headers.get('location')).toBeNull()
    })
  })

  describe('Unauthenticated Users', () => {
    it('redirects unauthenticated user to /connexion when accessing protected route', async () => {
      const middleware = await loadMiddleware()
      const req = createMockRequest('/tableau-de-bord', null)
      const response = await middleware(req)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/connexion')
    })

    it('redirects unauthenticated user to /connexion when accessing /annonces', async () => {
      const middleware = await loadMiddleware()
      const req = createMockRequest('/annonces', null)
      const response = await middleware(req)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/connexion')
    })

    it('allows unauthenticated user to access public routes', async () => {
      const middleware = await loadMiddleware()
      const req = createMockRequest('/connexion', null)
      const response = await middleware(req)

      expect(response.headers.get('location')).toBeNull()
    })
  })

  describe('Authenticated Active Users', () => {
    it('allows active user to access protected routes', async () => {
      const middleware = await loadMiddleware()
      const session = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          accountStatus: 'active',
        },
      }

      const req = createMockRequest('/tableau-de-bord', session)
      const response = await middleware(req)

      expect(response.headers.get('location')).toBeNull()
    })

    it('allows active user to access /annonces', async () => {
      const middleware = await loadMiddleware()
      const session = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          accountStatus: 'active',
        },
      }

      const req = createMockRequest('/annonces', session)
      const response = await middleware(req)

      expect(response.headers.get('location')).toBeNull()
    })

    it('allows active user to access public routes', async () => {
      const middleware = await loadMiddleware()
      const session = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          accountStatus: 'active',
        },
      }

      const req = createMockRequest('/a-propos', session)
      const response = await middleware(req)

      expect(response.headers.get('location')).toBeNull()
    })
  })
})
