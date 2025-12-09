/**
 * Utilitaires de monitoring réutilisables pour opérations courantes
 *
 * Features:
 * - Monitoring de requêtes DB
 * - Monitoring d'appels API externes
 * - Monitoring d'envoi d'emails
 * - Monitoring de traitement de fichiers
 * - Circuit breaker pour services externes
 */

import { logger, measurePerformance, startSpan } from "./logger";
import * as Sentry from "@sentry/nextjs";

interface MonitoringOptions {
  /**
   * Nom de l'opération pour les logs
   */
  operation: string;

  /**
   * Seuil de performance en ms (warning si dépassé)
   */
  slowThreshold?: number;

  /**
   * Contexte additionnel pour les logs
   */
  context?: Record<string, unknown>;
}

/**
 * Monitorer une requête vers Sanity
 */
export async function monitorSanityQuery<T>(
  fn: () => Promise<T>,
  options: MonitoringOptions
): Promise<T> {
  const { operation, slowThreshold = 500, context } = options;

  return await measurePerformance(
    `Sanity: ${operation}`,
    async () => {
      return await startSpan(operation, 'db.query', fn);
    },
    { ...context, service: 'sanity' }
  );
}

/**
 * Monitorer un appel API externe
 */
export async function monitorExternalApi<T>(
  fn: () => Promise<T>,
  options: MonitoringOptions & {
    url: string;
    method?: string;
  }
): Promise<T> {
  const { operation, url, method = 'GET', slowThreshold = 2000, context } = options;

  const startTime = performance.now();

  try {
    return await startSpan(operation, 'http.client', fn);
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);

    logger.error(`External API failed: ${operation}`, error as Error, {
      url,
      method,
      duration,
      ...context,
    });

    // Ajouter des breadcrumbs Sentry pour debugging
    Sentry.addBreadcrumb({
      category: 'http',
      message: `Failed: ${method} ${url}`,
      level: 'error',
      data: {
        url,
        method,
        duration,
      },
    });

    throw error;
  } finally {
    const duration = Math.round(performance.now() - startTime);

    if (duration > slowThreshold) {
      logger.warn(`Slow external API: ${operation}`, {
        url,
        method,
        duration,
        threshold: slowThreshold,
        ...context,
      });
    }
  }
}

/**
 * Monitorer l'envoi d'un email
 */
export async function monitorEmailSend(
  fn: () => Promise<void>,
  options: {
    to: string;
    subject: string;
    template?: string;
  }
): Promise<void> {
  const { to, subject, template } = options;

  logger.info('Sending email', {
    to: to.replace(/(.{2}).*@/, '$1***@'), // Masquer l'email
    subject,
    template,
  });

  try {
    await measurePerformance(
      'Email send',
      fn,
      {
        subject,
        template,
      }
    );

    logger.activity('Email sent successfully', {
      subject,
      template,
    });
  } catch (error) {
    logger.error('Email send failed', error as Error, {
      subject,
      template,
    });

    // Alerter Sentry pour les échecs d'email
    Sentry.captureException(error, {
      tags: {
        operation: 'email.send',
        template,
      },
      contexts: {
        email: {
          subject,
          template,
        },
      },
    });

    throw error;
  }
}

/**
 * Monitorer le traitement d'un fichier
 */
export async function monitorFileProcessing<T>(
  fn: () => Promise<T>,
  options: {
    fileName: string;
    operation: string;
    fileSize?: number;
  }
): Promise<T> {
  const { fileName, operation, fileSize } = options;

  logger.info(`Processing file: ${operation}`, {
    fileName,
    fileSize,
  });

  try {
    return await measurePerformance(
      `File: ${operation}`,
      fn,
      {
        fileName,
        fileSize,
      }
    );
  } catch (error) {
    logger.error(`File processing failed: ${operation}`, error as Error, {
      fileName,
      fileSize,
    });

    throw error;
  }
}

/**
 * Circuit breaker simple pour éviter de surcharger un service défaillant
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(
    fn: () => Promise<T>,
    serviceName: string
  ): Promise<T> {
    // Si le circuit est ouvert, refuser l'exécution
    if (this.state === 'open') {
      const timeSinceFailure = Date.now() - this.lastFailureTime;

      if (timeSinceFailure < this.timeout) {
        const error = new Error(`Circuit breaker is open for ${serviceName}`);
        logger.warn('Circuit breaker preventing call', {
          service: serviceName,
          failures: this.failures,
          state: this.state,
        });
        throw error;
      }

      // Passer en half-open pour tester
      this.state = 'half-open';
      logger.info('Circuit breaker entering half-open state', {
        service: serviceName,
      });
    }

    try {
      const result = await fn();

      // Succès : réinitialiser le circuit
      if (this.state === 'half-open' || this.failures > 0) {
        this.reset();
        logger.info('Circuit breaker reset after success', {
          service: serviceName,
        });
      }

      return result;
    } catch (error) {
      this.recordFailure(serviceName);
      throw error;
    }
  }

  private recordFailure(serviceName: string): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
      logger.error('Circuit breaker opened', undefined, {
        service: serviceName,
        failures: this.failures,
        threshold: this.threshold,
      });

      // Alerter Sentry
      Sentry.captureMessage(`Circuit breaker opened for ${serviceName}`, {
        level: 'error',
        tags: {
          service: serviceName,
          circuitBreaker: 'open',
        },
        contexts: {
          circuitBreaker: {
            failures: this.failures,
            threshold: this.threshold,
          },
        },
      });
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

// Circuit breakers pour services externes communs
export const circuitBreakers = {
  sanity: new CircuitBreaker(5, 60000),
  email: new CircuitBreaker(3, 120000),
  storage: new CircuitBreaker(5, 60000),
  externalApi: new CircuitBreaker(5, 60000),
};

/**
 * Monitorer une opération avec circuit breaker
 */
export async function monitorWithCircuitBreaker<T>(
  fn: () => Promise<T>,
  serviceName: keyof typeof circuitBreakers,
  operation: string
): Promise<T> {
  const breaker = circuitBreakers[serviceName];

  return await breaker.execute(async () => {
    return await measurePerformance(
      `${serviceName}: ${operation}`,
      fn,
      { service: serviceName }
    );
  }, `${serviceName}.${operation}`);
}

/**
 * Utilitaire pour créer un healthcheck endpoint
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    [key: string]: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
  };
  timestamp: string;
}

export async function performHealthCheck(
  checks: {
    [key: string]: () => Promise<void>;
  }
): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    status: 'healthy',
    checks: {},
    timestamp: new Date().toISOString(),
  };

  for (const [name, check] of Object.entries(checks)) {
    const startTime = performance.now();

    try {
      await check();
      result.checks[name] = {
        status: 'up',
        responseTime: Math.round(performance.now() - startTime),
      };
    } catch (error) {
      result.checks[name] = {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Math.round(performance.now() - startTime),
      };

      result.status = 'unhealthy';
    }
  }

  // Si certains checks sont down mais pas tous, status = degraded
  const downCount = Object.values(result.checks).filter(c => c.status === 'down').length;
  if (downCount > 0 && downCount < Object.keys(checks).length) {
    result.status = 'degraded';
  }

  return result;
}
