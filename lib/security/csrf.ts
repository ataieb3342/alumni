/**
 * Protection CSRF des routes d'écriture (double cookie + vérification d'origine).
 *
 * 1. Le proxy dépose un cookie `csrf_token` (aléatoire, SameSite=Strict) ;
 * 2. le client le recopie dans l'en-tête `x-csrf-token` (lib/client/api.ts) ;
 * 3. le serveur exige l'égalité des deux et une en-tête `Origin` (ou `Referer`)
 *    du même site. Un autre site ne peut ni lire le cookie ni forger l'en-tête.
 */
export const CSRF_COOKIE = 'csrf_token'
export const CSRF_HEADER = 'x-csrf-token'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function generateCsrfToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return undefined
}

/** Origines acceptées : celle de la requête et l'URL publique configurée */
function allowedOrigins(request: Request): Set<string> {
  const origins = new Set<string>([new URL(request.url).origin])
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol.replace(':', '')
  if (host) origins.add(`${proto}://${host}`)
  for (const value of [process.env.NEXT_PUBLIC_BASE_URL, process.env.AUTH_URL, process.env.NEXTAUTH_URL]) {
    if (!value) continue
    try {
      origins.add(new URL(value).origin)
    } catch {
      // valeur invalide ignorée
    }
  }
  return origins
}

export type CsrfResult = { ok: true } | { ok: false; reason: string }

export function verifyCsrf(request: Request): CsrfResult {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return { ok: true }

  const origin = request.headers.get('origin') ?? (() => {
    const referer = request.headers.get('referer')
    try {
      return referer ? new URL(referer).origin : null
    } catch {
      return null
    }
  })()
  if (!origin || !allowedOrigins(request).has(origin)) return { ok: false, reason: 'origin' }

  const cookie = readCookie(request, CSRF_COOKIE)
  const header = request.headers.get(CSRF_HEADER)
  if (!cookie || !header || !timingSafeEqual(cookie, header)) return { ok: false, reason: 'token' }
  return { ok: true }
}
