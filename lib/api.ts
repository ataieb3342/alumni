/**
 * Enveloppe commune des routes d'API : contrôle d'accès (relu en base),
 * CSRF, limitation de débit, validation Zod et erreurs homogènes.
 *
 *   export const POST = apiRoute({ auth: 'admin', body: schema }, async ({ user, body }) => …)
 */
import { NextResponse, type NextRequest } from 'next/server'
import { ZodError, type ZodType, type z } from 'zod'
import { HttpError, requireAdmin, requireUser } from '@/lib/auth/session'
import type { User } from '@/lib/data/users'
import { logger } from '@/lib/logger'
import { rateLimit, type RateLimitConfig } from '@/lib/rate-limit'
import { verifyCsrf } from '@/lib/security/csrf'

type Access = 'public' | 'user' | 'admin'

interface Options<B extends ZodType | undefined> {
  auth: Access
  /** Schéma du corps JSON ; les clés inconnues sont retirées */
  body?: B
  /** Désactivable pour les routes appelées hors navigateur (cron, webhooks) */
  csrf?: boolean
  rateLimit?: RateLimitConfig
}

type Context<A extends Access, B extends ZodType | undefined> = {
  req: NextRequest
  params: Record<string, string>
  user: A extends 'public' ? User | null : User
  body: B extends ZodType ? z.infer<B> : undefined
}

export function apiRoute<A extends Access, B extends ZodType | undefined = undefined>(
  options: Options<B> & { auth: A },
  handler: (ctx: Context<A, B>) => Promise<Response | unknown>
) {
  return async (req: NextRequest, routeContext?: { params?: Promise<Record<string, string>> }) => {
    try {
      if (options.csrf !== false) {
        const csrf = verifyCsrf(req)
        if (!csrf.ok) throw new HttpError(403, 'Requête refusée (protection CSRF). Rechargez la page et réessayez.')
      }
      if (options.rateLimit) {
        const limited = rateLimit(req, options.rateLimit)
        if (!limited.success) return limited.response
      }

      let user: User | null = null
      if (options.auth === 'admin') user = await requireAdmin()
      else if (options.auth === 'user') user = await requireUser()

      let body: unknown = undefined
      if (options.body) {
        let raw: unknown
        try {
          raw = await req.json()
        } catch {
          throw new HttpError(400, 'Corps de requête invalide')
        }
        body = options.body.parse(raw)
      }

      const params = (await routeContext?.params) ?? {}
      const result = await handler({ req, params, user, body } as Context<A, B>)
      if (result instanceof Response) return result
      return NextResponse.json(result ?? { success: true })
    } catch (error) {
      return errorResponse(error)
    }
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message, ...(error.field ? { field: error.field } : {}) }, { status: error.status })
  }
  if (error instanceof ZodError) {
    const issue = error.issues[0]
    return NextResponse.json(
      {
        error: issue?.message ?? 'Données invalides',
        field: issue?.path?.join('.'),
        issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
      { status: 400 }
    )
  }
  logger.error('Erreur API inattendue', error)
  return NextResponse.json({ error: 'Une erreur est survenue. Réessayez dans un instant.' }, { status: 500 })
}
