/**
 * Réception des Web Vitals envoyés par le navigateur (navigator.sendBeacon,
 * qui ne peut pas joindre d'en-tête CSRF). Rien n'est écrit en base : les
 * mesures sont seulement journalisées, une fois validées et bornées.
 */
import { z } from 'zod'
import { apiRoute } from '@/lib/api'
import { logger } from '@/lib/logger'

const schema = z.object({
  name: z.enum(['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB']),
  value: z.number().finite().min(0).max(600_000),
  rating: z.enum(['good', 'needs-improvement', 'poor']).optional(),
  url: z.string().max(300).optional(),
  userAgent: z.string().max(300).optional(),
  timestamp: z.number().optional(),
})

export const POST = apiRoute(
  { auth: 'public', csrf: false, body: schema, rateLimit: { maxRequests: 60, windowMs: 60_000 } },
  async ({ body }) => {
    logger.info(`Web Vital: ${body.name}`, { metric: body.name, value: body.value, rating: body.rating, url: body.url })
    return { success: true }
  }
)
