/**
 * Web Vitals tracking pour mesurer les performances côté client
 *
 * Métriques trackées :
 * - LCP (Largest Contentful Paint) - temps de chargement du plus gros élément
 * - FID (First Input Delay) - temps de réponse à la première interaction
 * - CLS (Cumulative Layout Shift) - stabilité visuelle
 * - FCP (First Contentful Paint) - premier élément visible
 * - TTFB (Time to First Byte) - temps de réponse serveur
 * - INP (Interaction to Next Paint) - réactivité générale
 *
 * @see https://web.dev/vitals/
 */

import * as Sentry from "@sentry/nextjs";

export interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
  navigationType: string;
}

/**
 * Envoyer une métrique Web Vitals
 */
function sendToAnalytics(metric: WebVitalMetric) {
  // En développement, logger dans la console
  if (process.env.NODE_ENV === 'development') {
    const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(
      `${emoji} [Web Vitals] ${metric.name}:`,
      `${Math.round(metric.value)}ms`,
      `(${metric.rating})`
    );
  }

  // En production, envoyer à Sentry
  if (process.env.NODE_ENV === 'production') {
    Sentry.setMeasurement(metric.name, metric.value, 'millisecond');

    // Envoyer les métriques critiques comme événements
    if (metric.rating === 'poor') {
      Sentry.captureMessage(`Poor ${metric.name}: ${metric.value}`, {
        level: 'warning',
        tags: {
          metric: metric.name,
          rating: metric.rating,
        },
        contexts: {
          performance: {
            value: metric.value,
            navigationType: metric.navigationType,
          },
        },
      });
    }
  }

  // Envoyer à votre propre API analytics (optionnel)
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.sendBeacon) {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });

    // Utiliser sendBeacon pour envoyer de manière fiable même lors de la fermeture de la page
    navigator.sendBeacon('/api/analytics/web-vitals', body);
  }
}

/**
 * Hook pour mesurer les Web Vitals
 * À appeler une seule fois au niveau du layout root
 */
export function reportWebVitals() {
  if (typeof window === 'undefined') return;

  // Importer dynamiquement web-vitals pour réduire le bundle
  // Note: FID a été déprécié en faveur de INP dans web-vitals v3+
  import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
    onCLS(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
    onINP(sendToAnalytics);
  });
}

/**
 * Mesurer les performances d'une navigation côté client
 */
export function measureNavigation(from: string, to: string) {
  if (typeof window === 'undefined') return;

  const startTime = performance.now();

  // Observer le prochain paint après la navigation
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const duration = performance.now() - startTime;

      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 [Navigation] ${from} → ${to}: ${Math.round(duration)}ms`);
      }

      // Envoyer à Sentry
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Navigated from ${from} to ${to}`,
        level: 'info',
        data: {
          duration,
          from,
          to,
        },
      });

      // Alerter si navigation lente
      if (duration > 2000) {
        Sentry.captureMessage(`Slow navigation: ${from} → ${to}`, {
          level: 'warning',
          tags: {
            from,
            to,
          },
          contexts: {
            performance: {
              duration,
            },
          },
        });
      }
    }
    observer.disconnect();
  });

  observer.observe({ entryTypes: ['paint'] });
}

/**
 * Mesurer une action utilisateur personnalisée
 */
export function measureUserAction(actionName: string, metadata?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;

  const startTime = performance.now();

  return {
    end: () => {
      const duration = performance.now() - startTime;

      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ [Action] ${actionName}: ${Math.round(duration)}ms`, metadata);
      }

      // Envoyer à Sentry
      Sentry.addBreadcrumb({
        category: 'user.action',
        message: actionName,
        level: 'info',
        data: {
          duration,
          ...metadata,
        },
      });

      // Alerter si action lente
      if (duration > 1000) {
        Sentry.captureMessage(`Slow action: ${actionName}`, {
          level: 'warning',
          tags: {
            action: actionName,
          },
          contexts: {
            performance: {
              duration,
              ...metadata,
            },
          },
        });
      }

      return duration;
    },
  };
}

/**
 * Hook pour mesurer le temps de montage d'un composant React
 */
export function useMeasureComponentMount(componentName: string) {
  if (typeof window === 'undefined') return;

  const mountTime = performance.now();

  return () => {
    const duration = performance.now() - mountTime;

    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.warn(`🐌 [Component] ${componentName} took ${Math.round(duration)}ms to mount`);
    }

    if (duration > 500) {
      Sentry.captureMessage(`Slow component mount: ${componentName}`, {
        level: 'warning',
        tags: {
          component: componentName,
        },
        contexts: {
          performance: {
            duration,
          },
        },
      });
    }
  };
}
