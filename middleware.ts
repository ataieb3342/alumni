import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Routes publiques (accessibles sans connexion)
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

  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  // Les webhooks et certaines routes API doivent être accessibles sans authentification
  const isPublicApiRoute = pathname.startsWith('/api/auth') ||
                          pathname.startsWith('/api/webhooks') ||
                          pathname.startsWith('/api/cron')

  // Les routes API publiques ne nécessitent pas d'authentification
  if (isPublicApiRoute) {
    return NextResponse.next()
  }

  // Si l'utilisateur a un ID temporaire (nouveau OAuth), il doit choisir son type
  // S'il essaie d'aller ailleurs, on le déconnecte automatiquement
  if (session?.user?.id?.startsWith('temp-') && pathname !== '/choisir-type' && !pathname.startsWith('/api/auth')) {
    // Rediriger vers la route de déconnexion avec retour vers /connexion
    return NextResponse.redirect(new URL('/api/auth/signout?callbackUrl=/connexion', req.url))
  }

  // Si l'utilisateur est connecté mais son compte n'est pas validé, limiter l'accès
  if (session?.user && session.user.accountStatus === 'pending' && !isPublicRoute && pathname !== '/validation-en-cours' && !pathname.startsWith('/api/auth')) {
    return NextResponse.redirect(new URL('/validation-en-cours', req.url))
  }

  // Si l'utilisateur n'est pas connecté et que la route n'est pas publique, rediriger vers /connexion
  if (!session && !isPublicRoute && !pathname.startsWith('/api/auth')) {
    return NextResponse.redirect(new URL('/connexion', req.url))
  }

  return NextResponse.next()
})

export const config = {
  // Matcher qui couvre toutes les routes sauf les fichiers statiques et les API Next.js internes
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}