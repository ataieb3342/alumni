export type OAuthProvider = 'google' | 'linkedin'

/**
 * Fournisseurs OAuth configurés (lu côté serveur : les identifiants ne
 * partent jamais vers le navigateur, seule la liste des boutons à afficher).
 */
export function availableProviders(): OAuthProvider[] {
  return [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? (['google'] as const) : []),
    ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET ? (['linkedin'] as const) : []),
  ]
}
