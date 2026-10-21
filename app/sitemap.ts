import type { MetadataRoute } from 'next'
import { listPublishedPosts } from '@/lib/data/posts'

// Lu à chaque demande : pas d'accès à la base pendant le build
export const dynamic = 'force-dynamic'

/** Plan du site : pages publiques et articles visibles de tous */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.vh-besancon-alumni.fr'
  const pages = ['/', '/a-propos', '/blog', '/alumni', '/inscription', '/connexion', '/mentions-legales', '/politique-confidentialite']
  const posts = await listPublishedPosts({ includeMembersOnly: false })
  return [
    ...pages.map((path) => ({ url: `${base}${path === '/' ? '' : path}`, changeFrequency: 'monthly' as const, priority: path === '/' ? 1 : 0.6 })),
    ...posts.map((post) => ({ url: `${base}/blog/${post.slug}`, lastModified: post.publishedAt, changeFrequency: 'yearly' as const, priority: 0.5 })),
  ]
}
