import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Taux d'échantillonnage pour edge runtime
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Désactiver en développement
  enabled: process.env.NODE_ENV === "production",

  // Configuration du contexte
  environment: process.env.NODE_ENV,
});
