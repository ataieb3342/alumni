import * as Sentry from "@sentry/nextjs";

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

  // Performance monitoring
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Ne capturer les replays que pour les erreurs
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Capturer les replays uniquement pour les erreurs
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0,
});
