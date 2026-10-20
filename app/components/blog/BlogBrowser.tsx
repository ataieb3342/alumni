'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Lock, Search } from 'lucide-react'
import type { ImageRef } from '@/db/schema'
import { normalize } from '@/lib/directorySearch'
import { cn } from '@/lib/utils'
import { Badge } from '@/app/components/ui/Badge'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { Button } from '@/app/components/ui/Button'
import { Select } from '@/app/components/ui/Field'

export interface BlogPostItem {
  id: string
  slug: string
  title: string
  excerpt: string | null
  mainImage: ImageRef | null
  publishedAt: Date
  visibility: 'public' | 'members'
  status: 'published' | 'draft' | 'archived'
  hasDraft?: boolean
}

const PER_PAGE = 9
const FALLBACKS = ['/images/lvh-facade-640x360.jpg', '/images/lycee-victor-hugo.jpg']

function fallbackFor(id: string) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return FALLBACKS[Math.abs(hash) % FALLBACKS.length]
}

/** Liste des articles : recherche, année, tri, pagination par 9 */
export function BlogBrowser({ posts }: { posts: BlogPostItem[] }) {
  const [query, setQuery] = useState('')
  const [year, setYear] = useState('')
  const [sort, setSort] = useState('date-desc')
  const [page, setPage] = useState(1)
  const years = useMemo(() => [...new Set(posts.map((p) => p.publishedAt.getFullYear()))].sort((a, b) => b - a), [posts])

  const filtered = useMemo(() => {
    const q = normalize(query)
    const list = posts.filter((post) => {
      if (year && String(post.publishedAt.getFullYear()) !== year) return false
      if (!q) return true
      return q.split(' ').every((token) => normalize(`${post.title} ${post.excerpt ?? ''}`).includes(token))
    })
    return list.sort((a, b) => {
      switch (sort) {
        case 'date-asc':
          return a.publishedAt.getTime() - b.publishedAt.getTime()
        case 'title-asc':
          return a.title.localeCompare(b.title, 'fr')
        case 'title-desc':
          return b.title.localeCompare(a.title, 'fr')
        default:
          return b.publishedAt.getTime() - a.publishedAt.getTime()
      }
    })
  }, [posts, query, year, sort])

  const key = `${query}|${year}|${sort}`
  const [lastKey, setLastKey] = useState(key)
  if (key !== lastKey) {
    setLastKey(key)
    setPage(1)
  }
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="space-y-8">
      <div className="grid gap-3 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-3 shadow-[var(--shadow-md)] sm:grid-cols-[1fr_auto_auto] sm:p-4">
        <div className="relative">
          <label htmlFor="blog-search" className="sr-only">
            Rechercher un article
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-blue" aria-hidden="true" />
          <input
            id="blog-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un article…"
            className="h-11 w-full rounded-[var(--radius-sm)] border border-line-strong/50 bg-paper-raised pr-3 pl-12 text-ink outline-none placeholder:text-ink-muted focus:border-blue"
          />
        </div>
        <label className="sr-only" htmlFor="blog-year">
          Année
        </label>
        <Select id="blog-year" value={year} onChange={(event) => setYear(event.target.value)} className="sm:w-40">
          <option value="">Toutes les années</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
        <label className="sr-only" htmlFor="blog-sort">
          Trier
        </label>
        <Select id="blog-sort" value={sort} onChange={(event) => setSort(event.target.value)} className="sm:w-52">
          <option value="date-desc">Plus récents d’abord</option>
          <option value="date-asc">Plus anciens d’abord</option>
          <option value="title-asc">Titre (A → Z)</option>
          <option value="title-desc">Titre (Z → A)</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="size-6" aria-hidden="true" />}
          title="Aucun article trouvé"
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery('')
                setYear('')
              }}
            >
              Réinitialiser
            </Button>
          }
        >
          Essayez de modifier vos critères de recherche.
        </EmptyState>
      ) : (
        <>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((post, index) => (
              <li key={post.id} className={cn(index === 0 && page === 1 && !query && !year && 'md:col-span-2')}>
                <Link href={`/blog/${post.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line bg-paper-raised shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
                  <div className="relative aspect-[16/9] overflow-hidden bg-paper-sunken">
                    <Image
                      src={post.mainImage?.url ?? fallbackFor(post.id)}
                      alt={post.mainImage?.alt ?? ''}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      {...(post.mainImage?.blurDataUrl ? { placeholder: 'blur' as const, blurDataURL: post.mainImage.blurDataUrl } : {})}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                      <time dateTime={post.publishedAt.toISOString()}>{post.publishedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
                      {post.visibility === 'members' && (
                        <Badge tone="outline" icon={<Lock className="size-3" aria-hidden="true" />}>
                          Membres
                        </Badge>
                      )}
                      {post.status !== 'published' && <Badge tone="highlight">Brouillon</Badge>}
                      {post.status === 'published' && post.hasDraft && <Badge tone="amber">Modifs non publiées</Badge>}
                    </div>
                    <h2 className="mt-2 text-xl leading-snug text-ink group-hover:text-blue">{post.title}</h2>
                    {post.excerpt && <p className="mt-2 line-clamp-3 text-ink-soft">{post.excerpt}</p>}
                    <span className="mt-auto pt-4 text-sm font-bold text-blue">Lire l’article →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-paper-raised disabled:opacity-40" aria-label="Page précédente">
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-current={n === page ? 'page' : undefined}
                  className={cn('inline-flex size-10 items-center justify-center rounded-full font-semibold', n === page ? 'bg-blue text-on-blue' : 'border border-line bg-paper-raised text-ink-soft hover:border-ink')}
                >
                  {n}
                </button>
              ))}
              <button type="button" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="inline-flex size-10 items-center justify-center rounded-full border border-line bg-paper-raised disabled:opacity-40" aria-label="Page suivante">
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
