/**
 * Système de logging professionnel avec structured logging
 *
 * Features:
 * - Structured JSON logging en production
 * - Correlation IDs pour tracer les requêtes
 * - Intégration Sentry pour error tracking
 * - Métriques de performance
 * - Contexte enrichi automatiquement
 */

import * as Sentry from "@sentry/nextjs";
import { AsyncLocalStorage } from "async_hooks";

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

interface LogContext {
  [key: string]: unknown;
}

interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  userId?: string;
  userEmail?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    cause?: unknown;
  };
}

// AsyncLocalStorage pour stocker le contexte de la requête
const requestContext = new AsyncLocalStorage<{
  correlationId?: string;
  userId?: string;
  userEmail?: string;
  route?: string;
  method?: string;
  startTime?: number;
}>();

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (isDevelopment) return true;
    // En production, logger info, warn et error
    return ['info', 'warn', 'error'].includes(level);
  }

  private getRequestContext() {
    return requestContext.getStore() || {};
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error): StructuredLog {
    const ctx = this.getRequestContext();

    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: ctx.correlationId,
      userId: ctx.userId,
      userEmail: ctx.userEmail,
      route: ctx.route,
      method: ctx.method,
    };

    if (context) {
      log.context = context;
    }

    if (error instanceof Error) {
      log.error = {
        name: error.name,
        message: error.message,
        stack: isDevelopment ? error.stack : undefined,
        cause: error.cause,
      };
    }

    return log;
  }

  private outputLog(log: StructuredLog): void {
    if (isProduction) {
      // En production : JSON structuré pour parsing facile
      console.log(JSON.stringify(log));
    } else {
      // En développement : format lisible avec couleurs
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[log.level];

      const color = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[34m',  // blue
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
      }[log.level];

      const reset = '\x1b[0m';
      const bold = '\x1b[1m';
      const dim = '\x1b[2m';

      let output = `${color}${emoji} [${log.level.toUpperCase()}]${reset} ${bold}${log.message}${reset}`;

      if (log.correlationId) {
        output += `\n  ${dim}└─ correlationId: ${log.correlationId}${reset}`;
      }

      if (log.route) {
        output += `\n  ${dim}└─ ${log.method} ${log.route}${reset}`;
      }

      if (log.userId) {
        output += `\n  ${dim}└─ user: ${log.userEmail || log.userId}${reset}`;
      }

      if (log.duration) {
        output += `\n  ${dim}└─ duration: ${log.duration}ms${reset}`;
      }

      if (log.context) {
        output += `\n  ${dim}└─ context: ${JSON.stringify(log.context, null, 2)}${reset}`;
      }

      if (log.error) {
        output += `\n  ${color}└─ ${log.error.name}: ${log.error.message}${reset}`;
        if (log.error.stack) {
          output += `\n${dim}${log.error.stack}${reset}`;
        }
      }

      console.log(output);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      const log = this.formatLog('debug', message, context);
      this.outputLog(log);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      const log = this.formatLog('info', message, context);
      this.outputLog(log);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      const log = this.formatLog('warn', message, context);
      this.outputLog(log);

      // Envoyer les warnings à Sentry
      if (isProduction) {
        Sentry.captureMessage(message, {
          level: 'warning',
          contexts: { custom: context },
        });
      }
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const err = error instanceof Error ? error : undefined;
      const log = this.formatLog('error', message, context, err);
      this.outputLog(log);

      // Envoyer les erreurs à Sentry
      if (err) {
        Sentry.captureException(err, {
          contexts: {
            custom: context,
          },
          tags: {
            correlationId: log.correlationId,
            route: log.route,
          },
        });
      } else {
        Sentry.captureMessage(message, {
          level: 'error',
          contexts: { custom: { ...context, error } },
        });
      }
    }
  }

  /**
   * Log spécifique pour les activités utilisateur importantes
   * (toujours loggé, même en production)
   */
  activity(message: string, context?: LogContext): void {
    const log = this.formatLog('info', `[ACTIVITY] ${message}`, context);
    this.outputLog(log);

    // Envoyer les activités importantes à Sentry comme breadcrumbs
    if (isProduction) {
      Sentry.addBreadcrumb({
        category: 'user.activity',
        message,
        level: 'info',
        data: context,
      });
    }
  }

  /**
   * Log avec mesure de performance
   */
  performance(message: string, durationMs: number, context?: LogContext): void {
    const log = this.formatLog('info', message, {
      ...context,
      duration: durationMs,
    });
    log.duration = durationMs;
    this.outputLog(log);

    // Envoyer les métriques de performance à Sentry
    if (isProduction && durationMs > 1000) {
      Sentry.captureMessage(`Slow operation: ${message}`, {
        level: 'warning',
        contexts: {
          performance: {
            duration: durationMs,
            ...context,
          },
        },
      });
    }
  }

  /**
   * Créer un child logger avec un contexte spécifique
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    const originalFormatLog = childLogger.formatLog.bind(childLogger);

    childLogger.formatLog = (level, message, extraContext, error) => {
      return originalFormatLog(level, message, { ...context, ...extraContext }, error);
    };

    return childLogger;
  }
}

// Export une instance singleton
export const logger = new Logger();

// Export AsyncLocalStorage pour middleware
export { requestContext };

// Helper pour les blocs try/catch
export function logError(error: unknown, context?: string): void {
  if (error instanceof Error) {
    logger.error(context || 'Une erreur est survenue', error);
  } else {
    logger.error(context || 'Une erreur inconnue est survenue', undefined, { error });
  }
}

// Helper pour mesurer la performance d'une fonction
export async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const startTime = performance.now();
  try {
    const result = await fn();
    const duration = Math.round(performance.now() - startTime);
    logger.performance(operation, duration, context);
    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    logger.error(`${operation} failed after ${duration}ms`, error as Error, context);
    throw error;
  }
}

// Helper pour créer un span Sentry
export function startSpan<T>(
  name: string,
  op: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op,
    },
    fn
  );
}
