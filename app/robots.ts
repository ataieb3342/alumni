import type { MetadataRoute } from 'next'

/**
 * Tout est explorable sauf l'administration et l'API. Les pages membres
 * renvoient un robot vers la connexion : inutile de les lister ici, ce qui
 * les ferait signaler comme « bloquées » par les outils d'audit.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.vh-besancon-alumni.fr'
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
