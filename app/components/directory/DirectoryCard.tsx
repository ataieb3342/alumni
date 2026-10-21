import Link from 'next/link'
import { Briefcase, GraduationCap, MapPin, Quote } from 'lucide-react'
import { getMemberSummary, MEMBER_TYPE_LABELS, type MatchHint } from '@/lib/directorySearch'
import type { DirectoryCardUser } from '@/lib/directoryView'
import { getSubject } from '@/lib/subjects'
import { cn } from '@/lib/utils'
import { Avatar } from '@/app/components/ui/Avatar'
import { SubjectIcon } from '@/app/components/ui/icons'

export type { DirectoryCardUser } from '@/lib/directoryView'

const HINT_ICONS = { experience: Briefcase, education: GraduationCap, bio: Quote }

/** Nouveau membre : inscrit il y a moins de 30 jours */
function isNew(createdAt?: string | Date) {
  if (!createdAt) return false
  return Date.now() - new Date(createdAt).getTime() < 30 * 24 * 60 * 60 * 1000
}

/**
 * Carte d'un membre : qui, quoi, où, en un coup d'œil. Les matières cochées
 * dans le filtre sont surlignées ; une ligne explique pourquoi le membre
 * ressort quand ce n'est pas visible (expérience, formation, bio).
 */
export function DirectoryCard({
  user,
  isMe = false,
  showNewBadge = false,
  hints = [],
  highlightSubjects = [],
}: {
  user: DirectoryCardUser
  isMe?: boolean
  showNewBadge?: boolean
  hints?: MatchHint[]
  highlightSubjects?: string[]
}) {
  const { headline, organization, isEducation, city } = getMemberSummary(user)
  const main = headline ?? organization
  const secondary = headline ? organization : undefined
  const RoleIcon = isEducation ? GraduationCap : Briefcase
  const subjects = (user.subjects ?? []).map(getSubject).filter((subject) => subject !== undefined)
  const fresh = showNewBadge && isNew(user.createdAt)

  return (
    <Link
      href={`/annuaire/${user.id}`}
      className={cn(
        'group relative flex h-full flex-col rounded-[var(--radius-lg)] border bg-paper-raised p-5 shadow-[var(--shadow-sm)] transition-[box-shadow,border-color,transform] duration-200',
        'hover:-translate-y-0.5 hover:border-blue/60 hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
        isMe ? 'border-blue/50' : 'border-line'
      )}
    >
      <div className="flex items-start gap-4">
        <Avatar firstName={user.firstName} lastName={user.lastName} image={user.profileImage} seed={user.id} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-sans text-[1.05rem] leading-snug font-bold break-words text-ink group-hover:text-blue">
              {user.firstName} {user.lastName}
            </h3>
            {isMe && <span className="shrink-0 rounded-full bg-blue-soft px-2 py-0.5 text-xs font-bold text-blue">Vous</span>}
            {fresh && !isMe && <span className="shrink-0 -rotate-3 font-hand text-lg leading-none text-red">Nouveau !</span>}
          </div>
          <p className="mt-0.5 text-sm text-ink-muted">
            {MEMBER_TYPE_LABELS[user.userType] ?? 'Membre'}
            {user.promotionYear ? ` · Promo ${user.promotionYear}` : ''}
          </p>
        </div>
      </div>

      {(main || city) && (
        <div className="mt-4 space-y-1.5 text-sm">
          {main && (
            <p className="flex items-start gap-2">
              <RoleIcon className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <span className="line-clamp-2 min-w-0">
                <span className="font-semibold text-ink">{main}</span>
                {secondary && <span className="text-ink-soft"> · {secondary}</span>}
              </span>
            </p>
          )}
          {city && (
            <p className="flex items-start gap-2 text-ink-soft">
              <MapPin className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
              <span className="min-w-0 break-words">{city}</span>
            </p>
          )}
        </div>
      )}

      {!main && !city && subjects.length === 0 && <p className="mt-4 text-sm text-ink-muted italic">Parcours pas encore renseigné</p>}

      {subjects.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Matières">
          {subjects.map((subject) => {
            const highlighted = highlightSubjects.includes(subject.value)
            return (
              <li
                key={subject.value}
                title={subject.label}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  highlighted ? 'bg-highlight text-on-highlight' : 'bg-paper-sunken text-ink-soft'
                )}
              >
                <SubjectIcon value={subject.value} className="size-3.5" />
                {subject.short}
              </li>
            )
          })}
        </ul>
      )}

      {hints.length > 0 && (
        <div className="mt-auto pt-4">
          <div className="space-y-1.5 border-t border-dashed border-line pt-3">
            {hints.map((hint) => {
              const Icon = HINT_ICONS[hint.kind]
              return (
                <p key={hint.label} className="flex items-start gap-2 text-xs text-ink-soft">
                  <Icon className="mt-0.5 size-3.5 shrink-0 text-red" aria-hidden="true" />
                  <span className="line-clamp-2 min-w-0">{hint.label}</span>
                </p>
              )
            })}
          </div>
        </div>
      )}
    </Link>
  )
}

export function DirectoryGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 [&>li]:min-w-0', className)}>{children}</ul>
}
