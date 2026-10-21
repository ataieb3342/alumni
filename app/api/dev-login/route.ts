import { NextResponse, type NextRequest } from 'next/server'
import { encode } from 'next-auth/jwt'
import { databaseUrl } from '@/db'
import { getUserByEmail } from '@/lib/data/users'

/**
 * Connexion de développement aux comptes de test locaux (@local.test), pour
 * vérifier les pages membres dans le navigateur sans manipuler de mot de passe.
 *
 * Inexistante hors développement : 404 sauf si NODE_ENV=development ET
 * ALLOW_DEV_LOGIN=1 ET base PGlite locale ET compte en @local.test.
 */
export async function GET(request: NextRequest) {
  const enabled = process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_LOGIN === '1' && databaseUrl().startsWith('pglite:')
  if (!enabled) return new NextResponse('Introuvable', { status: 404 })

  const as = request.nextUrl.searchParams.get('as') === 'member' ? 'membre@local.test' : 'admin@local.test'
  const user = await getUserByEmail(as)
  if (!user || !user.email.endsWith('@local.test')) return new NextResponse('Compte local absent : npm run db:seed-local', { status: 404 })

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) return new NextResponse('Secret manquant', { status: 500 })
  const name = 'authjs.session-token'
  const value = await encode({
    salt: name,
    secret,
    token: {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      role: user.role,
      accountStatus: user.accountStatus,
      checkedAt: Date.now(),
    },
  })
  const response = NextResponse.redirect(new URL(request.nextUrl.searchParams.get('to') ?? '/accueil', request.url))
  response.cookies.set(name, value, { path: '/', httpOnly: true, sameSite: 'lax' })
  return response
}
