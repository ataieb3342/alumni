import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/lib/auth.config'
import { CSRF_COOKIE, generateCsrfToken } from '@/lib/security/csrf'
import { EDIT_MODE_COOKIE } from '@/lib/edit-mode'
import { safeCallbackUrl } from '@/lib/utils'

// Proxy sans accès à la base : seul le jeton de session est lu ici. Les
// droits d'écriture sont revérifiés en base par chaque route (lib/api.ts).
const { auth } = NextAuth(authConfig)

/** Pages accessibles sans compte (et leurs sous-pages) */
export const PUBLIC_ROUTES = [
  '/',
  '/connexion',
  '/inscription',
  '/mot-de-passe-oublie',
  '/reinitialiser-mot-de-passe',
  '/invitation',
  '/validation-en-cours',
  '/a-propos',
  '/politique-confidentialite',
  '/mentions-legales',
  '/blog',
  '/alumni',
  '/qrcode',
  '/media',
]

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID()
  const startTime = Date.now()

  // Les routes d'API contrôlent elles-mêmes l'accès (session relue en base, CSRF)
  const isApi = pathname.startsWith('/api/')

  if (!isApi) {
    // Nouveau compte OAuth : choix du type de membre d'abord
    if (session?.user?.id?.startsWith('temp-') && pathname !== '/choisir-type') {
      return NextResponse.redirect(new URL('/choisir-type', req.url))
    }

    // Compte en attente ou désactivé : seulement les pages publiques
    if (session?.user && session.user.accountStatus && session.user.accountStatus !== 'active' && !session.user.id?.startsWith('temp-') && !isPublicPath(pathname)) {
      return NextResponse.redirect(new URL('/validation-en-cours', req.url))
    }

    if (!session && !isPublicPath(pathname)) {
      const login = new URL('/connexion', req.url)
      if (pathname !== '/accueil') login.searchParams.set('callbackUrl', pathname + req.nextUrl.search)
      return NextResponse.redirect(login)
    }

    // Les membres ont leur propre accueil (sauf un administrateur qui modifie la page d'accueil publique).
    // Redirigé ici plutôt que dans la page : app/loading.tsx y déclencherait un rafraîchissement côté client.
    const isActiveMember = session?.user?.accountStatus === 'active' && !session.user.id?.startsWith('temp-')
    const editingHome = session?.user?.role === 'admin' && req.cookies.get(EDIT_MODE_COOKIE)?.value === '1'
    if (pathname === '/' && isActiveMember && !editingHome) {
      return NextResponse.redirect(new URL('/accueil', req.url))
    }

    // Déjà connecté : ni inscription ni connexion (retour à la page demandée si elle est sur le site)
    if (isActiveMember && (pathname === '/inscription' || pathname === '/connexion')) {
      return NextResponse.redirect(new URL(safeCallbackUrl(req.nextUrl.searchParams.get('callbackUrl')), req.url))
    }

    // L'administration est réservée aux administrateurs (revérifié en base dans les pages)
    if (pathname.startsWith('/admin') && session?.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/accueil', req.url))
    }
  }

  const response = NextResponse.next()
  response.headers.set('x-correlation-id', correlationId)
  response.headers.set('x-response-time', `${Date.now() - startTime}ms`)

  if (!req.cookies.get(CSRF_COOKIE)) {
    response.cookies.set(CSRF_COOKIE, generateCsrfToken(), {
      path: '/',
      sameSite: 'strict',
      secure: req.nextUrl.protocol === 'https:',
      httpOnly: false,
    })
  }
  return response
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
