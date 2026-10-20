import Link from 'next/link'
import { Lock } from 'lucide-react'
import { requireAdminPage } from '@/lib/auth/session'
import { CONTENT_KEYS, CONTENT_PAGES } from '@/lib/content/definitions'
import { getDb } from '@/db'
import { contentEntries, posts as postsTable } from '@/db/schema'
import { listAllAnnouncements } from '@/lib/data/announcements'
import { listAllTestimonials } from '@/lib/data/testimonials'
import { desc } from 'drizzle-orm'
import { AdminCard, AdminHeader } from '@/app/components/admin/AdminCard'
import { EditOnPageLink } from '@/app/components/admin/EditOnPageLink'
import { NewPostButton } from '@/app/components/blog/NewPostButton'
import { ItemActions } from '@/app/components/content/ItemActions'
import { Badge } from '@/app/components/ui/Badge'
import { ANNOUNCEMENT_TYPES_META } from '@/app/components/announcements/meta'
import { TESTIMONIAL_TYPES_INFO } from '@/lib/testimonials'

export const metadata = { title: 'Contenus' }

const STATUS = { published: { label: 'Publié', tone: 'green' }, draft: { label: 'Brouillon', tone: 'highlight' }, archived: { label: 'Archivé', tone: 'neutral' } } as const

export default async function AdminContentPage() {
  await requireAdminPage()
  const db = await getDb()
  const [entries, posts, announcements, testimonials] = await Promise.all([
    db.select({ key: contentEntries.key, hasDraft: contentEntries.draft, publishedAt: contentEntries.publishedAt, updatedAt: contentEntries.updatedAt }).from(contentEntries),
    db
      .select({ id: postsTable.id, slug: postsTable.slug, title: postsTable.title, status: postsTable.status, visibility: postsTable.visibility, publishedAt: postsTable.publishedAt, hasDraft: postsTable.draft })
      .from(postsTable)
      .orderBy(desc(postsTable.publishedAt)),
    listAllAnnouncements(),
    listAllTestimonials(),
  ])
  const entryByKey = new Map(entries.map((entry) => [entry.key, entry]))

  return (
    <div className="space-y-6">
      <AdminHeader title="Contenus" lead="Pages, articles, annonces et témoignages. Les textes des pages se modifient directement sur le site, en mode édition." />

      <AdminCard title="Pages du site">
        <ul className="divide-y divide-line">
          {CONTENT_KEYS.filter((key) => key !== 'site').map((key) => {
            const entry = entryByKey.get(key)
            return (
              <li key={key} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-bold text-ink">{CONTENT_PAGES[key].label}</p>
                  <p className="text-sm text-ink-muted">
                    {CONTENT_PAGES[key].path}
                    {entry?.publishedAt ? ` · publiée le ${entry.publishedAt.toLocaleDateString('fr-FR')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {entry?.hasDraft ? <Badge tone="highlight">Brouillon en cours</Badge> : <Badge tone="green">À jour</Badge>}
                  <EditOnPageLink href={CONTENT_PAGES[key].path} />
                </div>
              </li>
            )
          })}
          <li className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-bold text-ink">{CONTENT_PAGES.site.label}</p>
              <p className="text-sm text-ink-muted">Nom, contact, adresse, réseaux sociaux, pied de page</p>
            </div>
            <Link href="/admin/parametres" className="link-ink text-sm font-semibold">
              Ouvrir les réglages
            </Link>
          </li>
        </ul>
      </AdminCard>

      <AdminCard title={`Articles du blog (${posts.length})`} action={<NewPostButton />}>
        <ul className="divide-y divide-line">
          {posts.map((post) => (
            <li key={post.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-bold text-ink">
                  {post.title}
                  <Badge tone={STATUS[post.status].tone}>{STATUS[post.status].label}</Badge>
                  {post.hasDraft && post.status === 'published' && <Badge tone="amber">Modifs non publiées</Badge>}
                  {post.visibility === 'members' && (
                    <Badge tone="outline" icon={<Lock className="size-3" aria-hidden="true" />}>
                      Membres
                    </Badge>
                  )}
                </p>
                <p className="text-sm text-ink-muted">{post.publishedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <EditOnPageLink href={`/blog/${post.slug}`} />
            </li>
          ))}
        </ul>
      </AdminCard>

      <AdminCard title={`Annonces (${announcements.length})`}>
        {announcements.length === 0 ? (
          <p className="text-ink-muted">Aucune annonce.</p>
        ) : (
          <ul className="divide-y divide-line">
            {announcements.map((a) => (
              <li key={a.id} className="space-y-2 py-3">
                <p className="flex flex-wrap items-center gap-2">
                  <Link href={`/annonces/${a.slug}`} className="font-bold text-ink hover:text-blue">
                    {a.title}
                  </Link>
                  <Badge tone="neutral">{ANNOUNCEMENT_TYPES_META[a.type].label}</Badge>
                  {a.expiresAt && a.expiresAt.getTime() < Date.now() && <Badge tone="red">Expirée</Badge>}
                </p>
                <p className="text-sm text-ink-muted">
                  {a.author ? `${a.author.firstName} ${a.author.lastName}` : 'Auteur supprimé'} · {a.publishedAt.toLocaleDateString('fr-FR')}
                  {a.eventDate ? ` · événement le ${a.eventDate.toLocaleDateString('fr-FR')}` : ''}
                </p>
                <ItemActions compact endpoint={`/api/announcements/${a.id}`} editHref={`/annonces/modifier/${a.slug}`} title={a.title} status={a.status} canModerate />
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <AdminCard title={`Témoignages (${testimonials.length})`}>
        {testimonials.length === 0 ? (
          <p className="text-ink-muted">Aucun témoignage.</p>
        ) : (
          <ul className="divide-y divide-line">
            {testimonials.map((t) => (
              <li key={t.id} className="space-y-2 py-3">
                <p className="flex flex-wrap items-center gap-2">
                  <Link href={`/temoignages/${t.slug}`} className="font-bold text-ink hover:text-blue">
                    {t.title}
                  </Link>
                  <Badge tone="neutral">{TESTIMONIAL_TYPES_INFO[t.type].short}</Badge>
                  {t.likes > 0 && <span className="text-sm text-ink-muted">{t.likes} ♥</span>}
                </p>
                <p className="text-sm text-ink-muted">{t.author ? `${t.author.firstName} ${t.author.lastName}` : 'Auteur supprimé'} · {t.createdAt.toLocaleDateString('fr-FR')}</p>
                <ItemActions compact endpoint={`/api/testimonials/${t.id}`} editHref={`/temoignages/modifier/${t.slug}`} title={t.title} status={t.status} canModerate />
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  )
}
