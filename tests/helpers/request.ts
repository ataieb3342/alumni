import { NextRequest } from 'next/server'

/**
 * Crée un NextRequest pour les tests
 * @param url - URL de la requête
 * @param options - Options de la requête
 * @returns NextRequest pour les tests
 */
export function createTestNextRequest(
  url: string,
  options: {
    method?: string
    body?: Record<string, unknown> | string
    headers?: Record<string, string>
    ip?: string
  } = {}
): NextRequest {
  const { method = 'GET', body, headers: customHeaders = {}, ip = '127.0.0.1' } = options

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
  }

  if (body) {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  const request = new NextRequest(url, requestInit)

  // Ajouter l'IP pour les tests de rate limiting
  const headers = new Headers(request.headers)
  headers.set('x-forwarded-for', ip)

  Object.defineProperty(request, 'headers', {
    value: headers,
    writable: true,
  })

  return request
}

/**
 * Crée un NextRequest POST pour les tests
 */
export function createTestPostRequest(
  url: string,
  body: Record<string, unknown>,
  options: { headers?: Record<string, string>; ip?: string } = {}
): NextRequest {
  return createTestNextRequest(url, {
    method: 'POST',
    body,
    ...options,
  })
}

/**
 * Crée un NextRequest GET pour les tests
 */
export function createTestGetRequest(
  url: string,
  options: { headers?: Record<string, string>; ip?: string } = {}
): NextRequest {
  return createTestNextRequest(url, {
    method: 'GET',
    ...options,
  })
}
