import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Si l'utilisateur est connecté et est nouveau, rediriger vers /choisir-type
  if (session?.user?.isNewUser && pathname !== '/choisir-type' && pathname !== '/api/auth/update-user-type') {
    return NextResponse.redirect(new URL('/choisir-type', req.url))
  }

  // Si l'utilisateur n'est pas connecté sur une route protégée, rediriger vers /connexion
  const protectedRoutes = [
    '/profil',
    '/annuaire',
    '/api/stats',
    '/api/newsletter/export',
    '/api/newsletter/sync-drive',
    '/api/announcements/create',
    '/api/profile/update',
    '/api/user/delete',
    '/api/user/preferences',
    '/choisir-type',
  ]

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/connexion', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/profil/:path*',
    '/annuaire/:path*',
    '/api/stats/:path*',
    '/api/newsletter/export/:path*',
    '/api/newsletter/sync-drive/:path*',
    '/api/announcements/create/:path*',
    '/api/announcements/:id/delete',
    '/api/profile/update/:path*',
    '/api/user/delete/:path*',
    '/api/user/preferences/:path*',
    '/choisir-type',
    '/api/auth/update-user-type',
  ],
}