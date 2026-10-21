/**
 * Fabrique un cookie de session NextAuth pour mesurer les pages membres en
 * local (Lighthouse, captures). Le compte n'a pas besoin d'exister : le jeton
 * porte un identifiant fictif et le statut « active ».
 *
 * Usage : NEXTAUTH_SECRET=… node tools/perf/session-cookie.mjs [userId] [email]
 * Le secret est lu dans l'environnement et n'est jamais affiché.
 */
import { createRequire } from 'node:module'
import path from 'node:path'

export async function sessionCookie({ cwd = process.cwd(), userId = 'perf-audit-user', email = 'perf-audit@example.invalid', role, userType = 'alumni' } = {}) {
  const require = createRequire(path.resolve(cwd, "package.json"))
  const { encode } = await import(require.resolve('@auth/core/jwt'))
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET manquant')
  // NextAuth préfixe le cookie par __Secure- quand son URL publique est en https
  const secure = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? '').startsWith('https')
  const name = `${secure ? '__Secure-' : ''}authjs.session-token`
  const value = await encode({
    salt: name,
    secret,
    token: { id: userId, email, name: 'Audit Perf', userType, accountStatus: 'active', ...(role ? { role } : {}) },
  })
  return { name, value, secure }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [userId, email] = process.argv.slice(2)
  const cookie = await sessionCookie({ userId, email })
  process.stdout.write(`${cookie.name}=${cookie.value}`)
}
