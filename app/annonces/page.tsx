import type { Metadata } from 'next'
import { Megaphone, NotebookPen } from 'lucide-react'
import { requireMemberPage } from '@/lib/auth/session'
import { loadPageContent } from '@/lib/content/page'
import { listPublishedAnnouncements } from '@/lib/data/announcements'
import { createEditor } from '@/app/components/edit/editor'
import { EditableArea } from '@/app/components/edit/EditableArea'
import { ButtonLink } from '@/app/components/ui/Button'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { PageHero } from '@/app/components/site/PageHero'
import { AnnouncementBrowser } from '@/app/components/announcements/AnnouncementBrowser'

export const metadata: Metadata = { title: 'Annonces', description: "Offres d'emploi, stages et opportunités partagées par les membres" }

export default async function AnnouncementsPage() {
  await requireMemberPage('/annonces')
  const [announcements, page] = await Promise.all([listPublishedAnnouncements(), loadPageContent('announcements')])
  const e = createEditor('content:announcements', page.data, page.editMode)
  return (
    <EditableArea docs={[page.doc]}>
      <PageHero
        size="sm"
        eyebrow="Le forum"
        title={e.text('title', { label: 'Titre' })}
        lead={e.text('lead', { as: 'p', label: 'Chapeau', multiline: true })}
        actions={
          <>
            <ButtonLink href="/annonces/nouvelle" icon={<Megaphone className="size-4" aria-hidden="true" />}>
              Publier une annonce
            </ButtonLink>
            <ButtonLink href="/annonces/mes-annonces" variant="secondary" icon={<NotebookPen className="size-4" aria-hidden="true" />}>
              Mes annonces
            </ButtonLink>
          </>
        }
      />
      <div className="container-page py-10 sm:py-14">
        {announcements.length === 0 ? (
          <EmptyState title="Aucune annonce en cours" action={<ButtonLink href="/annonces/nouvelle">Publier la première</ButtonLink>}>
            Un stage, un job, un événement ? Partagez-le avec la communauté.
          </EmptyState>
        ) : (
          <AnnouncementBrowser
            announcements={announcements.map((a) => ({
              id: a.id,
              slug: a.slug,
              title: a.title,
              type: a.type,
              company: a.company,
              location: a.location,
              description: a.description.slice(0, 400),
              publishedAt: a.publishedAt,
              eventDate: a.eventDate,
              author: a.author ? { id: a.author.id, firstName: a.author.firstName, lastName: a.author.lastName, profileImage: a.author.profileImage } : null,
            }))}
          />
        )}
      </div>
    </EditableArea>
  )
}
