import Link from 'next/link'
import { Building2, CalendarDays, MapPin } from 'lucide-react'
import type { AnnouncementType } from '@/db/schema'
import { formatEventDate } from '@/lib/eventDate'
import { Badge } from '@/app/components/ui/Badge'
import { Avatar } from '@/app/components/ui/Avatar'
import type { ImageRef } from '@/db/schema'
import { ANNOUNCEMENT_TYPES_META } from './meta'

export interface AnnouncementCardData {
  id: string
  slug: string
  title: string
  type: AnnouncementType
  company: string | null
  location: string | null
  description: string
  publishedAt: Date
  eventDate: Date | null
  author: { id: string; firstName: string; lastName: string; profileImage: ImageRef | null } | null
}

export function AnnouncementCard({ announcement }: { announcement: AnnouncementCardData }) {
  const meta = ANNOUNCEMENT_TYPES_META[announcement.type]
  const Icon = meta.icon
  return (
    <Link
      href={`/annonces/${announcement.slug}`}
      className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-blue/60 hover:shadow-[var(--shadow-md)]"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge tone={meta.tone} icon={<Icon className="size-3.5" aria-hidden="true" />}>
          {meta.label}
        </Badge>
        <time dateTime={announcement.publishedAt.toISOString()} className="text-xs text-ink-muted">
          {announcement.publishedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </time>
      </div>
      <h3 className="mt-3 text-xl leading-snug text-ink group-hover:text-blue">{announcement.title}</h3>
      <div className="mt-2 space-y-1 text-sm text-ink-soft">
        {announcement.type === 'event' && announcement.eventDate && (
          <p className="flex items-center gap-1.5 font-semibold text-red-strong first-letter:uppercase">
            <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
            <span className="first-letter:uppercase">{formatEventDate(announcement.eventDate.toISOString())}</span>
          </p>
        )}
        {announcement.company && (
          <p className="flex items-center gap-1.5">
            <Building2 className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
            {announcement.company}
          </p>
        )}
        {announcement.location && (
          <p className="flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
            {announcement.location}
          </p>
        )}
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-ink-soft">{announcement.description.replace(/^\s*[•\-*]\s+/gm, '')}</p>
      {announcement.author && (
        <div className="mt-auto flex items-center gap-2.5 border-t border-line pt-4 text-sm">
          <Avatar firstName={announcement.author.firstName} lastName={announcement.author.lastName} image={announcement.author.profileImage} seed={announcement.author.id} size="xs" />
          <span className="truncate font-semibold text-ink-soft">
            {announcement.author.firstName} {announcement.author.lastName}
          </span>
        </div>
      )}
    </Link>
  )
}
