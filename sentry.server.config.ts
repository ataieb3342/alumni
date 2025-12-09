import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Ajuster le taux d'échantillonnage selon vos besoins
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Désactiver en développement
  enabled: process.env.NODE_ENV === "production",

  // Configuration du contexte
  environment: process.env.NODE_ENV,

  // Ignorer certaines erreurs connues
  ignoreErrors: [
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
  ],

  // Enrichir les événements
  beforeSend(event) {
    // Ajouter le contexte utilisateur si disponible
    if (event.user) {
      event.user = {
        ...event.user,
        // Ne pas envoyer d'infos sensibles
        email: event.user.email ? "***@***" : undefined,
      };
    }
    return event;
  },

  // Intégrations serveur
  integrations: [
    // Tracer les requêtes HTTP
    Sentry.httpIntegration({
      tracing: true,
    }),
  ],
});
