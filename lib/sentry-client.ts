/**
 * SDK Sentry du navigateur, chargé à la demande : ~110 Ko de JavaScript qui
 * n'ont rien à faire sur le chemin critique d'affichage. Rien n'est chargé
 * sans DSN ni hors production.
 */
type SentryModule = typeof import('@sentry/nextjs')

let loading: Promise<SentryModule> | null = null

export function loadSentry(): Promise<SentryModule> | null {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.NODE_ENV !== 'production') return null
  loading ??= import('@sentry/nextjs')
  return loading
}
