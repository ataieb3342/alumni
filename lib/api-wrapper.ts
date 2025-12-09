/**
 * Wrapper pour les routes API avec monitoring automatique
 *
 * Features:
 * - Extraction automatique du correlation ID
 * - Logging structuré avec contexte
 * - Mesure de performance
 * - Gestion d'erreurs uniforme
 * - Intégration Sentry
 */

import { NextRequest, NextResponse } from "next/server";
import { logger, requestContextManager } from "./logger";
import * as Sentry from "@sentry/nextjs";

interface ApiHandlerOptions {
  /**
   * Nom de la route pour les logs (ex: "POST /api/auth/register")
   */
  name: string;

  /**
   * Méthodes HTTP autorisées
   */
  allowedMethods?: string[];

  /**
   * Si true, ne pas logger les requêtes réussies (utile pour les health checks)
   */
  silent?: boolean;
}

type ApiHandler = (
  req: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Wrapper pour les routes API
 *
 * @example
 * ```ts
 * export const POST = withApiHandler(
 *   async (req) => {
 *     const body = await req.json();
 *     // ... logique métier
 *     return NextResponse.json({ success: true });
 *   },
 *   { name: "POST /api/announcements/create" }
 * );
 * ```
 */
export function withApiHandler(
  handler: ApiHandler,
  options: ApiHandlerOptions
): ApiHandler {
  return async (req, context) => {
    const startTime = performance.now();

    // Extraire le correlation ID des headers
    const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
    const userId = req.headers.get('x-user-id');
    const method = req.method;
    const route = new URL(req.url).pathname;

    // Vérifier la méthode HTTP si spécifiée
    if (options.allowedMethods && !options.allowedMethods.includes(method)) {
      logger.warn(`Method ${method} not allowed on ${route}`, {
        allowedMethods: options.allowedMethods,
        correlationId,
      });
      return NextResponse.json(
        { error: `Method ${method} not allowed` },
        { status: 405 }
      );
    }

    // Créer le contexte de la requête pour AsyncLocalStorage
    const reqContext = {
      correlationId,
      userId: userId || undefined,
      route,
      method,
      startTime,
    };

    // Logger le début de la requête
    if (!options.silent) {
      logger.info(`${options.name} started`, {
        method,
        route,
        correlationId,
        userId,
      });
    }

    // Exécuter le handler dans le contexte AsyncLocalStorage
    try {
      const executeHandler = async () => {
        // Créer un span Sentry pour la transaction
        return await Sentry.startSpan(
          {
            name: options.name,
            op: 'http.server',
            attributes: {
              'http.method': method,
              'http.route': route,
            },
          },
          async () => {
            return await handler(req, context);
          }
        );
      };

      // Utiliser le requestContextManager pour gérer le contexte
      const response = await requestContextManager.run(reqContext, executeHandler);

      const duration = Math.round(performance.now() - startTime);
      const statusCode = response.status;

      // Logger la réponse
      if (!options.silent) {
        logger.info(`${options.name} completed`, {
          method,
          route,
          statusCode,
          duration,
          correlationId,
          userId,
        });
      }

      // Alerter si la requête est lente
      if (duration > 2000) {
        logger.warn(`Slow API response: ${options.name}`, {
          duration,
          route,
          method,
          correlationId,
        });
      }

      // Ajouter le correlation ID aux headers de réponse
      response.headers.set('x-correlation-id', correlationId);
      response.headers.set('x-response-time', `${duration}ms`);

      return response;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);

      // Logger l'erreur
      logger.error(`${options.name} failed`, error as Error, {
        method,
        route,
        duration,
        correlationId,
        userId,
      });

      // Envoyer à Sentry avec le contexte complet
      Sentry.captureException(error, {
        contexts: {
          request: {
            method,
            url: route,
            correlationId,
            userId,
            duration,
          },
        },
        tags: {
          correlationId,
          route,
          method,
        },
      });

      // Retourner une erreur 500 avec le correlation ID pour le debugging
      return NextResponse.json(
        {
          error: 'Internal server error',
          correlationId,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        {
          status: 500,
          headers: {
            'x-correlation-id': correlationId,
            'x-response-time': `${duration}ms`,
          },
        }
      );
    }
  };
}

/**
 * Helper pour créer un contexte de requête API manuellement
 * Utile pour les fonctions appelées en dehors du cycle de vie HTTP
 */
export async function withRequestContext<T>(
  fn: () => Promise<T>,
  context: {
    correlationId?: string;
    userId?: string;
    route?: string;
    operation?: string;
  }
): Promise<T> {
  const reqContext = {
    correlationId: context.correlationId || crypto.randomUUID(),
    userId: context.userId,
    route: context.route,
    method: 'INTERNAL',
    startTime: performance.now(),
  };

  // Utiliser le requestContextManager pour gérer le contexte
  return await requestContextManager.run(reqContext, fn);
}
