/**
 * Système de logging pour production
 *
 * En production: seules les erreurs critiques sont loggées
 * En développement: tous les logs sont affichés
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (isDevelopment) return true
    // En production, on ne log que les erreurs
    return level === 'error'
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` | ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        ...(error instanceof Error && {
          error: {
            message: error.message,
            stack: isDevelopment ? error.stack : undefined,
            name: error.name,
          }
        })
      }
      console.error(this.formatMessage('error', message, errorContext))
    }
  }

  /**
   * Log spécifique pour les activités utilisateur importantes
   * (toujours loggé, même en production)
   */
  activity(message: string, context?: LogContext): void {
    if (isProduction) {
      // En production, on peut envoyer vers un service de monitoring
      // Pour l'instant, on log juste l'essentiel
      console.log(`[ACTIVITY] ${message}`)
    } else {
      console.log(this.formatMessage('info', `[ACTIVITY] ${message}`, context))
    }
  }
}

// Export une instance singleton
export const logger = new Logger()

// Helper pour les blocs try/catch
export function logError(error: unknown, context?: string): void {
  if (error instanceof Error) {
    logger.error(context || 'Une erreur est survenue', error)
  } else {
    logger.error(context || 'Une erreur inconnue est survenue', undefined, { error })
  }
}
