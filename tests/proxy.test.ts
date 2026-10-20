// @vitest-environment node
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type FakeSession = { user: { id: string; role?: string; accountStatus?: string } } | null
let session: FakeSession = null

// Le proxy ne lit que le jeton de session : NextAuth est remplacé par un lecteur factice
vi.mock('next-auth', () => ({
  default: () => ({
    auth: (handler: (req: NextRequest & { auth: FakeSession }) => Response) => (req: NextRequest) => handler(Object.assign(req, { auth: session })),
  }),
}))

const { default: proxy, isPublicPath } = await import('@/proxy')

const visit = (pathname: string, cookie?: string) =>
  proxy(new NextRequest(new URL(pathname, 'http://localhost:3000'), { headers: cookie ? { cookie } : {} }), {} as never) as unknown as Response

const redirectedTo = (response: Response) => {
  const location = response.headers.get('location')
  return location ? new URL(location).pathname + new URL(location).search : null
}

describe('Proxy : accès aux pages', () => {
  beforeEach(() => {
    session = null
  })

  it('les pages publiques restent ouvertes aux visiteurs', async () => {
    for (const path of ['/', '/connexion', '/a-propos', '/blog/mon-article', '/mentions-legales', '/media/uploads/a.webp']) {
      expect(redirectedTo(await visit(path)), path).toBeNull()
    }
    expect(isPublicPath('/annuaire')).toBe(false)
    expect(isPublicPath('/blogueur')).toBe(false)
  })

  it('un visiteur est renvoyé vers la connexion, avec la page demandée en retour', async () => {
    expect(redirectedTo(await visit('/annuaire?ville=Lyon'))).toBe('/connexion?callbackUrl=%2Fannuaire%3Fville%3DLyon')
    expect(redirectedTo(await visit('/accueil'))).toBe('/connexion')
    expect(redirectedTo(await visit('/admin'))).toBe('/connexion?callbackUrl=%2Fadmin')
  })

  it('un compte en attente ou suspendu ne voit que les pages publiques', async () => {
    session = { user: { id: 'u1', accountStatus: 'pending' } }
    expect(redirectedTo(await visit('/annuaire'))).toBe('/validation-en-cours')
    expect(redirectedTo(await visit('/a-propos'))).toBeNull()
    session = { user: { id: 'u1', accountStatus: 'suspended' } }
    expect(redirectedTo(await visit('/annonces'))).toBe('/validation-en-cours')
  })

  it('un nouveau compte Google ou LinkedIn choisit d’abord son type de membre', async () => {
    session = { user: { id: 'temp-123', accountStatus: 'pending' } }
    expect(redirectedTo(await visit('/annuaire'))).toBe('/choisir-type')
    expect(redirectedTo(await visit('/choisir-type'))).toBeNull()
  })

  it('l’administration est réservée aux administrateurs', async () => {
    session = { user: { id: 'u1', role: 'member', accountStatus: 'active' } }
    expect(redirectedTo(await visit('/admin/utilisateurs'))).toBe('/accueil')
    expect(redirectedTo(await visit('/annuaire'))).toBeNull()
    session = { user: { id: 'u2', role: 'admin', accountStatus: 'active' } }
    expect(redirectedTo(await visit('/admin/utilisateurs'))).toBeNull()
  })

  it('les routes d’API ne sont pas redirigées : elles contrôlent elles-mêmes l’accès', async () => {
    expect(redirectedTo(await visit('/api/admin/users'))).toBeNull()
  })

  it('pose un jeton CSRF (SameSite=Strict, lisible par le script de la page) une seule fois', async () => {
    const first = await visit('/')
    const cookie = first.headers.get('set-cookie') ?? ''
    expect(cookie).toMatch(/csrf_token=[A-Za-z0-9_-]{32,}/)
    expect(cookie).toMatch(/SameSite=strict/i)
    expect(cookie).not.toMatch(/HttpOnly/i)
    const again = await visit('/', 'csrf_token=deja-pose')
    expect(again.headers.get('set-cookie')).toBeNull()
  })
})
