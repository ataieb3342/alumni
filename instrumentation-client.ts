/**
 * Sentry côté navigateur. Avec Turbopack (Next 16), seul ce fichier est chargé :
 * l'ancien sentry.client.config.ts n'était plus exécuté.
 */
import { loadSentry } from "@/lib/sentry-client";

let sentry: Awaited<ReturnType<typeof loadSentry>> | undefined;

loadSentry()?.then((Sentry) => {
  sentry = Sentry;
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Ajuster le taux d'échantillonnage selon vos besoins
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Désactiver en développement
    enabled: process.env.NODE_ENV === "production",

    // Configuration du contexte
    environment: process.env.NODE_ENV,

    // Ne pas logger les erreurs de fetch échouées (souvent des timeouts)
    ignoreErrors: [
      "AbortError",
      "NetworkError",
      "fetch",
      // Erreurs communes du navigateur
      "Non-Error promise rejection captured",
      "ResizeObserver loop limit exceeded",
    ],

    // Configuration des breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Ne pas logger les requêtes vers des services externes non pertinents
      if (breadcrumb.category === "fetch" && breadcrumb.data?.url?.includes("analytics")) {
        return null;
      }
      return breadcrumb;
    },

    // Enrichir les événements avec des métadonnées
    beforeSend(event) {
      // Ajouter des tags personnalisés
      if (event.request?.url) {
        event.tags = {
          ...event.tags,
          route: event.request.url,
        };
      }
      return event;
    },

    // Trace propagation configuration (moved to top level in newer Sentry versions)
    tracePropagationTargets: ["localhost", /^\//],

    // Performance monitoring. Pas de Session Replay : ~50 Ko de plus sur chaque
    // page, et l'enregistrement des sessions des membres (voir DECISIONS.md)
    integrations: [Sentry.browserTracingIntegration()],
  });
});

// Suivi des navigations côté client (une fois le SDK chargé)
export function onRouterTransitionStart(...args: Parameters<NonNullable<typeof sentry>["captureRouterTransitionStart"]>) {
  sentry?.captureRouterTransitionStart(...args);
}
