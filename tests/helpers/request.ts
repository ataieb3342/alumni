import { NextRequest } from 'next/server'

const CSRF = 'test-csrf-token-0123456789abcdef0123456789abcdef0123456789abcdef'
const ORIGIN = 'http://localhost:3000'

/**
 * Requête comme l'enverrait le navigateur du site : même origine, cookie et
 * en-tête CSRF. Les options permettent de simuler une requête intersites.
 */
export function apiRequest(
  pathname: string,
  options: { method?: string; body?: unknown; formData?: FormData; csrf?: boolean; origin?: string | null; ip?: string } = {}
) {
  const method = options.method ?? (options.body !== undefined || options.formData ? 'POST' : 'GET')
  const headers = new Headers()
  if (options.origin !== null) headers.set('origin', options.origin ?? ORIGIN)
  if (options.csrf !== false) {
    headers.set('cookie', `csrf_token=${CSRF}`)
    headers.set('x-csrf-token', CSRF)
  }
  headers.set('x-forwarded-for', options.ip ?? `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`)
  let body: BodyInit | undefined
  if (options.formData) body = options.formData
  else if (options.body !== undefined) {
    headers.set('content-type', 'application/json')
    body = JSON.stringify(options.body)
  }
  return new NextRequest(new URL(pathname, ORIGIN), { method, headers, body })
}

/** Paramètres dynamiques d'une route (`{ params: Promise<…> }` côté Next 16) */
export function routeParams<T extends Record<string, string>>(params: T) {
  return { params: Promise.resolve(params) }
}


/** Requête brute avec en-têtes choisis (tests du limiteur de débit) */
export function createTestNextRequest(
  url: string,
  options: { method?: string; body?: Record<string, unknown> | string; headers?: Record<string, string>; ip?: string } = {}
): NextRequest {
  const { method = 'GET', body, headers = {}, ip = '127.0.0.1' } = options
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip, ...headers },
    ...(body ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  })
}

export function createTestGetRequest(url: string, options: { headers?: Record<string, string>; ip?: string } = {}) {
  return createTestNextRequest(url, { method: 'GET', ...options })
}
