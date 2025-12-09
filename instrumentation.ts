/**
 * Instrumentation pour Next.js
 * Permet d'initialiser des services au démarrage de l'application
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Charger la configuration Sentry en fonction de l'environnement d'exécution
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
