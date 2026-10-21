'use client'

/**
 * Appels d'API depuis le navigateur : ajoute l'en-tête CSRF et renvoie une
 * erreur lisible (message de l'API, champ fautif).
 */
const CSRF_COOKIE = 'csrf_token'

function csrfToken(): string {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public field?: string, public issues?: { path: string; message: string }[]) {
    super(message)
  }
}

export async function api<T = unknown>(url: string, options: { method?: string; body?: unknown; formData?: FormData } = {}): Promise<T> {
  const method = options.method ?? (options.body !== undefined || options.formData ? 'POST' : 'GET')
  const headers: Record<string, string> = { 'x-csrf-token': csrfToken() }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.formData ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiError('Connexion impossible. Vérifiez votre réseau et réessayez.', 0)
  }
  const data = response.headers.get('content-type')?.includes('application/json') ? await response.json().catch(() => ({})) : {}
  if (!response.ok) {
    throw new ApiError((data as { error?: string }).error ?? 'Une erreur est survenue', response.status, (data as { field?: string }).field, (data as { issues?: { path: string; message: string }[] }).issues)
  }
  return data as T
}
