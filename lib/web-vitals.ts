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

import { loadSentry } from "@/lib/sentry-client";

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

  // En production, envoyer à Sentry (SDK chargé à la demande)
  loadSentry()?.then((Sentry) => {
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
  });


  // Envoyer à votre propre API analytics (optionnel)
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.sendBeacon) {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      // Chemin seulement : la recherche (?q=…) peut contenir des noms de membres
      url: window.location.pathname.slice(0, 300),
      userAgent: navigator.userAgent.slice(0, 300),
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
