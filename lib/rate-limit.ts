import { NextRequest, NextResponse } from 'next/server'

/**
 * Configuration du rate limiter
 */
export interface RateLimitConfig {
  /**
   * Nombre maximum de requêtes autorisées dans la fenêtre de temps
   */
  maxRequests: number
  /**
   * Durée de la fenêtre de temps en millisecondes
   */
  windowMs: number
  /**
   * Message d'erreur personnalisé
   */
  message?: string
}

/**
 * Stockage des tentatives de requêtes par IP
 * Format: Map<IP, Array<timestamp>>
 */
const requestStore = new Map<string, number[]>()

/**
 * Nettoie les anciennes entrées du store toutes les 60 secondes
 */
setInterval(() => {
  const now = Date.now()
  for (const [ip, timestamps] of requestStore.entries()) {
    // Garder seulement les timestamps des 24 dernières heures
    const recentTimestamps = timestamps.filter(ts => now - ts < 24 * 60 * 60 * 1000)
    if (recentTimestamps.length === 0) {
      requestStore.delete(ip)
    } else {
      requestStore.set(ip, recentTimestamps)
    }
  }
}, 60 * 1000)

/**
 * Extrait l'adresse IP de la requête
 */
function getClientIp(request: NextRequest): string {
  // Essayer d'obtenir l'IP depuis les headers (proxy, CDN)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // Fallback sur l'IP de connexion
  return request.headers.get('x-client-ip') || 'unknown'
}

/**
 * Middleware de rate limiting
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = rateLimit(request, {
 *     maxRequests: 5,
 *     windowMs: 60 * 1000, // 1 minute
 *   })
 *
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response
 *   }
 *
 *   // Continuer avec la logique normale
 * }
 * ```
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): { success: boolean; response?: NextResponse } {
  const ip = getClientIp(request)
  const now = Date.now()
  const windowStart = now - config.windowMs

  // Récupérer les tentatives existantes pour cette IP
  let attempts = requestStore.get(ip) || []

  // Filtrer les tentatives dans la fenêtre de temps actuelle
  attempts = attempts.filter(timestamp => timestamp > windowStart)

  // Vérifier si la limite est dépassée
  if (attempts.length >= config.maxRequests) {
    const oldestAttempt = Math.min(...attempts)
    const resetTime = oldestAttempt + config.windowMs
    const retryAfter = Math.ceil((resetTime - now) / 1000)

    return {
      success: false,
      response: NextResponse.json(
        {
          error: config.message || 'Trop de requêtes. Veuillez réessayer plus tard.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          },
        }
      ),
    }
  }

  // Ajouter la nouvelle tentative
  attempts.push(now)
  requestStore.set(ip, attempts)

  return { success: true }
}

/**
 * Configurations de rate limiting prédéfinies
 */
export const RateLimitPresets = {
  /**
   * Pour les routes d'authentification (login, register, forgot password)
   * 5 requêtes par minute
   */
  auth: {
    maxRequests: 5,
    windowMs: 60 * 1000,
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 1 minute.',
  },

  /**
   * Pour les routes de création de contenu (announcements, testimonials)
   * 10 requêtes par 5 minutes
   */
  contentCreation: {
    maxRequests: 10,
    windowMs: 5 * 60 * 1000,
    message: 'Trop de créations de contenu. Veuillez réessayer dans quelques minutes.',
  },

  /**
   * Pour les routes publiques générales
   * 100 requêtes par minute
   */
  general: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    message: 'Trop de requêtes. Veuillez ralentir.',
  },

  /**
   * Pour les routes sensibles (changement de mot de passe, suppression de compte)
   * 3 requêtes par heure
   */
  sensitive: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
    message: 'Trop de requêtes sensibles. Veuillez réessayer dans 1 heure.',
  },

  /**
   * Pour les routes d'envoi d'emails
   * 3 requêtes par 15 minutes
   */
  email: {
    maxRequests: 3,
    windowMs: 15 * 60 * 1000,
    message: 'Trop d\'emails envoyés. Veuillez réessayer dans 15 minutes.',
  },
} as const

/**
 * Fonction utilitaire pour obtenir les statistiques de rate limiting
 * (utile pour le debugging)
 */
export function getRateLimitStats(ip?: string) {
  if (ip) {
    const attempts = requestStore.get(ip) || []
    return {
      ip,
      attempts: attempts.length,
      timestamps: attempts,
    }
  }

  return {
    totalIps: requestStore.size,
    totalAttempts: Array.from(requestStore.values()).reduce(
      (sum, attempts) => sum + attempts.length,
      0
    ),
  }
}

/**
 * Réinitialise le store de rate limiting
 * (utile pour les tests)
 */
export function resetRateLimitStore() {
  requestStore.clear()
}
