import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, Building2, CalendarDays, Mail, MapPin, Phone } from 'lucide-react'
import { requireMemberPage } from '@/lib/auth/session'
import { getAnnouncementBySlug } from '@/lib/data/announcements'
import { eventCountdown, formatEventDate } from '@/lib/eventDate'
import { Alert } from '@/app/components/ui/Alert'
import { Avatar } from '@/app/components/ui/Avatar'
import { Badge } from '@/app/components/ui/Badge'
import { buttonClasses } from '@/app/components/ui/Button'
import { ItemActions } from '@/app/components/content/ItemActions'
import { ANNOUNCEMENT_TYPES_META } from '@/app/components/announcements/meta'
import { PlainText } from '@/app/components/announcements/PlainText'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const announcement = await getAnnouncementBySlug((await params).slug)
  return { title: announcement?.title ?? 'Annonce' }
}

export default async function AnnouncementPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const viewer = await requireMemberPage(`/annonces/${slug}`)
  const announcement = await getAnnouncementBySlug(slug, viewer)
  if (!announcement) notFound()
  const meta = ANNOUNCEMENT_TYPES_META[announcement.type]
  const Icon = meta.icon
  const current = announcement.author?.experience.find((exp) => exp.current)
  const expired = announcement.expiresAt && announcement.expiresAt.getTime() < Date.now()
  const canEdit = viewer.id === announcement.authorId || viewer.role === 'admin'

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link href="/annonces" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-blue">
          <ArrowLeft className="size-4" aria-hidden="true" /> Toutes les annonces
        </Link>
        {(announcement.status !== 'published' || expired) && (
          <Alert tone="warning" className="mt-4">
            Cette annonce est {expired ? 'expirée' : announcement.status === 'draft' ? 'en brouillon' : 'archivée'} : seuls son auteur et les administrateurs la voient.
          </Alert>
        )}
        <article className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border border-line bg-paper-raised shadow-[var(--shadow-md)]">
          <header className="border-b border-line p-6 sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge tone={meta.tone} icon={<Icon className="size-3.5" aria-hidden="true" />}>
                {meta.label}
              </Badge>
              <time dateTime={announcement.publishedAt.toISOString()} className="text-sm text-ink-muted">
                Publiée le {announcement.publishedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </time>
            </div>
            <h1 className="mt-4 font-display-tight text-[clamp(1.9rem,4.5vw,2.75rem)] leading-tight text-ink">{announcement.title}</h1>
            {announcement.type === 'event' && announcement.eventDate && (
              <p className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] bg-highlight px-4 py-2.5 font-semibold text-on-highlight">
                <CalendarDays className="size-5" aria-hidden="true" />
                <span className="first-letter:uppercase">{formatEventDate(announcement.eventDate.toISOString())}</span>
                {announcement.eventDate.getTime() > Date.now() && <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs text-paper">{eventCountdown(announcement.eventDate.toISOString())}</span>}
              </p>
            )}
            {(announcement.company || announcement.location) && (
              <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-ink-soft">
                {announcement.company && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="size-4 text-ink-muted" aria-hidden="true" /> {announcement.company}
                  </span>
                )}
                {announcement.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 text-ink-muted" aria-hidden="true" /> {announcement.location}
                  </span>
                )}
              </p>
            )}
          </header>
          <div className="p-6 sm:p-9">
            <PlainText text={announcement.description} />
          </div>
          <footer className="space-y-6 border-t border-line bg-paper p-6 sm:p-9">
            <div className="flex flex-wrap gap-3">
              {announcement.contactEmail && (
                <a href={`mailto:${announcement.contactEmail}`} className={buttonClasses('primary')}>
                  <Mail className="size-4" aria-hidden="true" /> Écrire
                </a>
              )}
              {announcement.contactPhone && (
                <a href={`tel:${announcement.contactPhone.replace(/\s/g, '')}`} className={buttonClasses('secondary')}>
                  <Phone className="size-4" aria-hidden="true" /> {announcement.contactPhone}
                </a>
              )}
              {announcement.externalLink && (
                <a href={announcement.externalLink} target="_blank" rel="noopener noreferrer" className={buttonClasses('secondary')}>
                  En savoir plus <ArrowUpRight className="size-4" aria-hidden="true" />
                  <span className="sr-only">(nouvel onglet)</span>
                </a>
              )}
            </div>
            {announcement.author && (
              <div className="flex items-center gap-3 border-t border-line pt-5">
                <Avatar firstName={announcement.author.firstName} lastName={announcement.author.lastName} image={announcement.author.profileImage} seed={announcement.author.id} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs text-ink-muted">Publiée par</p>
                  <Link href={`/annuaire/${announcement.author.id}`} className="font-bold text-ink hover:text-blue">
                    {announcement.author.firstName} {announcement.author.lastName}
                  </Link>
                  {current && (
                    <p className="text-sm text-ink-muted">
                      {current.position} · {current.company}
                    </p>
                  )}
                </div>
              </div>
            )}
            {canEdit && (
              <div className="border-t border-line pt-5">
                <ItemActions
                  endpoint={`/api/announcements/${announcement.id}`}
                  editHref={`/annonces/modifier/${announcement.slug}`}
                  title={announcement.title}
                  status={announcement.status}
                  canModerate={viewer.role === 'admin'}
                  afterDelete="/annonces"
                />
              </div>
            )}
          </footer>
        </article>
      </div>
    </div>
  )
}
