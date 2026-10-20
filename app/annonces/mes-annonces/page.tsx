import type { Metadata } from 'next'
import { Megaphone } from 'lucide-react'
import { requireMemberPage } from '@/lib/auth/session'
import { listAnnouncementsByAuthor } from '@/lib/data/announcements'
import { Badge } from '@/app/components/ui/Badge'
import { ButtonLink } from '@/app/components/ui/Button'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { PageHero } from '@/app/components/site/PageHero'
import { ItemActions } from '@/app/components/content/ItemActions'
import { ANNOUNCEMENT_TYPES_META } from '@/app/components/announcements/meta'

export const metadata: Metadata = { title: 'Mes annonces' }

export default async function MyAnnouncementsPage() {
  const user = await requireMemberPage('/annonces/mes-annonces')
  const announcements = await listAnnouncementsByAuthor(user.id)
  return (
    <>
      <PageHero
        size="sm"
        eyebrow="Annonces"
        title="Mes annonces"
        actions={
          <ButtonLink href="/annonces/nouvelle" icon={<Megaphone className="size-4" aria-hidden="true" />}>
            Nouvelle annonce
          </ButtonLink>
        }
      />
      <div className="container-page py-10">
        <div className="mx-auto max-w-4xl">
          {announcements.length === 0 ? (
            <EmptyState title="Aucune annonce" action={<ButtonLink href="/annonces/nouvelle">Créer une annonce</ButtonLink>}>
              Commencez par créer votre première annonce.
            </EmptyState>
          ) : (
            <ul className="space-y-4">
              {announcements.map((announcement) => {
                const meta = ANNOUNCEMENT_TYPES_META[announcement.type]
                const expired = announcement.expiresAt && announcement.expiresAt.getTime() < Date.now()
                return (
                  <li key={announcement.id} className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      {announcement.status === 'draft' && <Badge tone="amber">Brouillon</Badge>}
                      {announcement.status === 'archived' && <Badge tone="neutral">Archivée</Badge>}
                      {expired && <Badge tone="red">Expirée</Badge>}
                      <span className="text-sm text-ink-muted">Publiée le {announcement.publishedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <h2 className="mt-2 text-xl text-ink">{announcement.title}</h2>
                    {(announcement.company || announcement.location) && <p className="text-sm text-ink-soft">{[announcement.company, announcement.location].filter(Boolean).join(' · ')}</p>}
                    <div className="mt-4">
                      <ItemActions
                        compact
                        endpoint={`/api/announcements/${announcement.id}`}
                        viewHref={`/annonces/${announcement.slug}`}
                        editHref={`/annonces/modifier/${announcement.slug}`}
                        title={announcement.title}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
