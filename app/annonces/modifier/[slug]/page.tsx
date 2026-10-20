import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { requireMemberPage } from '@/lib/auth/session'
import { getAnnouncementBySlug } from '@/lib/data/announcements'
import { PageHero } from '@/app/components/site/PageHero'
import { AnnouncementForm } from '@/app/components/announcements/AnnouncementForm'

export const metadata: Metadata = { title: 'Modifier une annonce' }

export default async function EditAnnouncementPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const viewer = await requireMemberPage(`/annonces/modifier/${slug}`)
  const announcement = await getAnnouncementBySlug(slug, viewer)
  if (!announcement) notFound()
  if (announcement.authorId !== viewer.id && viewer.role !== 'admin') redirect('/annonces/mes-annonces')
  return (
    <>
      <PageHero size="sm" eyebrow="Annonces" title="Modifier l’annonce" lead={announcement.title} />
      <div className="container-page py-10">
        <div className="mx-auto max-w-3xl">
          <AnnouncementForm
            initial={{
              id: announcement.id,
              title: announcement.title,
              type: announcement.type,
              company: announcement.company,
              location: announcement.location,
              description: announcement.description,
              contactEmail: announcement.contactEmail,
              contactPhone: announcement.contactPhone,
              externalLink: announcement.externalLink,
              expiresAt: announcement.expiresAt?.toISOString() ?? null,
              eventDate: announcement.eventDate?.toISOString() ?? null,
            }}
          />
        </div>
      </div>
    </>
  )
}
