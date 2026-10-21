import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Briefcase, CalendarDays, Clock, Compass, MapPin, MessageSquareQuote, Newspaper, PenLine, Search, UserRoundPen } from 'lucide-react'
import { requireMemberPage } from '@/lib/auth/session'
import { loadPageContent } from '@/lib/content/page'
import { withCount } from '@/lib/content/merge'
import { listDirectoryMembers, listRecentMembers } from '@/lib/data/users'
import { listPublishedAnnouncements, listUpcomingEvents } from '@/lib/data/announcements'
import { listPopularTestimonials } from '@/lib/data/testimonials'
import { listPublishedPosts } from '@/lib/data/posts'
import { indexMember, suggestCities } from '@/lib/directorySearch'
import { eventCountdown, eventDateParts, formatEventDate, formatEventTime } from '@/lib/eventDate'
import { SUBJECTS } from '@/lib/subjects'
import { joinFrench, plural } from '@/lib/utils'
import { createEditor } from '@/app/components/edit/editor'
import { EditableArea } from '@/app/components/edit/EditableArea'
import { buttonClasses } from '@/app/components/ui/Button'
import { SubjectIcon } from '@/app/components/ui/icons'
import { SectionHeading } from '@/app/components/site/PageHero'
import { DirectoryCard, DirectoryGrid } from '@/app/components/directory/DirectoryCard'
import { toCardUser } from '@/app/components/directory/toCardUser'

export const metadata: Metadata = { title: 'Accueil' }

function shortDate(date: Date) {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' })
}

export default async function MemberHomePage() {
  const user = await requireMemberPage('/accueil')
  const [page, members, recentMembers, events, announcements, testimonials, posts] = await Promise.all([
    loadPageContent('member-home'),
    listDirectoryMembers(),
    listRecentMembers(6),
    listUpcomingEvents(3),
    listPublishedAnnouncements(6),
    listPopularTestimonials(3),
    listPublishedPosts({ includeMembersOnly: true, limit: 3 }),
  ])
  const e = createEditor('content:member-home', page.data, page.editMode)

  // Mêmes décomptes que l'annuaire, pour que chaque lien tienne sa promesse
  const indexed = members.map((member) => indexMember(toCardUser(member)))
  const subjectCounts = new Map<string, number>()
  for (const member of members) for (const subject of member.subjects) subjectCounts.set(subject, (subjectCounts.get(subject) ?? 0) + 1)
  const subjects = SUBJECTS.filter((subject) => subjectCounts.get(subject.value))
  const popular = [...subjects].sort((a, b) => subjectCounts.get(b.value)! - subjectCounts.get(a.value)!).slice(0, 5)
  const cities = suggestCities(indexed, 'any')

  // Ce qu'il manque au profil pour qu'on le trouve (les lycéens ne sont pas dans l'annuaire)
  const me = indexed.find((entry) => entry.member.id === user.id)
  const missing = me
    ? [
        !me.summary.city && 'ta ville',
        !me.member.subjects?.length && 'tes matières',
        !me.summary.headline && 'ton poste ou tes études',
        me.member.userType !== 'staff' && !me.member.promotionYear && 'ta promo',
      ].filter((item): item is string => !!item)
    : []

  const [nextEvent, ...laterEvents] = events
  const opportunities = announcements.filter((a) => !events.some((event) => event.id === a.id)).slice(0, 3)
  const isLyceen = user.userType === 'lyceen'

  return (
    <EditableArea docs={[page.doc]}>
      <section className="bg-wash">
        <div className="container-page pt-8 pb-24 sm:pt-12 sm:pb-28">
          {nextEvent && nextEvent.eventDate && (
            <div className="mb-10">
              <Link
                href={`/annonces/${nextEvent.slug}`}
                className="group relative flex items-center gap-4 overflow-hidden rounded-[var(--radius-lg)] bg-highlight p-4 text-on-highlight shadow-[0_6px_0_0_#c9a915] transition-transform hover:-translate-y-0.5 sm:gap-6 sm:p-6"
              >
                <CalendarDays aria-hidden="true" className="absolute -right-6 -bottom-8 size-40 -rotate-12 text-on-highlight/10" strokeWidth={1.25} />
                <div className="w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-paper-raised text-center shadow-[var(--shadow-md)] sm:w-24">
                  <div className="bg-red py-1 text-[11px] font-bold tracking-wider text-on-red uppercase sm:text-xs">{eventDateParts(nextEvent.eventDate.toISOString()).month.replace('.', '')}</div>
                  <div className="py-1.5 font-display-tight text-3xl leading-none text-ink sm:py-3 sm:text-5xl">{eventDateParts(nextEvent.eventDate.toISOString()).day}</div>
                </div>
                <div className="relative min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-wider uppercase sm:text-sm">
                    Prochain événement
                    <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs tracking-normal text-paper normal-case">{eventCountdown(nextEvent.eventDate.toISOString())}</span>
                  </p>
                  <h2 className="mt-1 line-clamp-3 text-xl leading-tight sm:text-3xl">{nextEvent.title}</h2>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-4 shrink-0" aria-hidden="true" />
                      <span className="sm:hidden">{formatEventTime(nextEvent.eventDate.toISOString())}</span>
                      <span className="hidden first-letter:uppercase sm:inline">{formatEventDate(nextEvent.eventDate.toISOString())}</span>
                    </span>
                    {(nextEvent.location || nextEvent.company) && (
                      <span className="inline-flex min-w-0 items-center gap-1.5">
                        <MapPin className="size-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{nextEvent.location || nextEvent.company}</span>
                      </span>
                    )}
                  </p>
                </div>
                <ArrowRight className="relative hidden size-7 shrink-0 transition-transform group-hover:translate-x-1 sm:block" aria-hidden="true" />
              </Link>
              {laterEvents.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                  <li className="self-center text-on-wash-soft">Aussi à venir :</li>
                  {laterEvents.map((event) => (
                    <li key={event.id}>
                      <Link href={`/annonces/${event.slug}`} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-semibold text-on-wash ring-1 ring-white/15 hover:bg-white/20">
                        <span className="text-highlight">{event.eventDate ? shortDate(event.eventDate) : ''}</span>
                        <span className="max-w-[16rem] truncate">{event.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <p className="font-hand text-2xl text-highlight">Bonjour {user.firstName} !</p>
          <h1 className="font-display-tight mt-1 max-w-3xl text-[clamp(2.1rem,5.5vw,3.75rem)] leading-[1.02] text-on-wash">
            {isLyceen ? e.text('titleLyceen', { label: 'Titre (lycéens)' }) : e.text('title', { label: 'Titre' })}{' '}
            <em className="text-highlight">{isLyceen ? e.text('accentLyceen', { label: 'Mot mis en valeur (lycéens)' }) : e.text('accent', { label: 'Mot mis en valeur' })}</em>
          </h1>
          {e.text('lead', { as: 'p', label: 'Chapeau ({count} = nombre de membres)', multiline: true, className: 'mt-4 max-w-2xl text-lg text-on-wash-soft', display: (value) => withCount(value, members.length) })}

          <form action="/annuaire" method="get" role="search" className="mt-7">
            <label htmlFor="home-search" className="sr-only">
              Rechercher dans l’annuaire
            </label>
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-paper-raised p-1.5 shadow-[var(--shadow-lg)] focus-within:shadow-[0_0_0_4px_rgb(255_228_92/0.6)] sm:p-2">
              <Search className="ml-2.5 size-5 shrink-0 text-blue" aria-hidden="true" />
              <input
                id="home-search"
                name="q"
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="Médecine, INSA, Lyon, développeur…"
                className="h-11 min-w-0 flex-1 bg-transparent text-[1.05rem] text-ink outline-none placeholder:text-ink-muted sm:h-12 [&::-webkit-search-cancel-button]:hidden"
              />
              <button type="submit" className={buttonClasses('primary', 'md', 'shrink-0')}>
                <span className="hidden min-[400px]:inline">Chercher</span>
                <ArrowRight className="size-5 min-[400px]:hidden" aria-hidden="true" />
                <span className="sr-only min-[400px]:hidden">Chercher</span>
              </button>
            </div>
          </form>

          {popular.length > 0 && (
            <div className="scrollbar-none -mx-4 mt-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              <span className="shrink-0 text-sm text-on-wash-soft">Populaires :</span>
              {popular.map((subject) => (
                <Link
                  key={subject.value}
                  href={`/annuaire?matiere=${subject.value}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-on-wash ring-1 ring-white/15 transition-colors hover:bg-paper-raised hover:text-ink"
                >
                  <SubjectIcon value={subject.value} className="size-4" />
                  {subject.short}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="container-page relative -mt-14 space-y-14 pb-16 sm:-mt-16 sm:space-y-20">
        <nav aria-label="Raccourcis" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { href: '/annuaire', icon: Compass, label: 'Parcourir l’annuaire', detail: plural(members.length, 'profil') },
            { href: '/profil', icon: UserRoundPen, label: 'Mon profil', detail: missing.length ? 'À compléter' : 'Modifier' },
            { href: '/annonces/nouvelle', icon: Briefcase, label: 'Poster une annonce', detail: 'Stages, jobs, événements' },
            { href: '/temoignages/nouveau', icon: PenLine, label: 'Écrire un témoignage', detail: 'Raconter ton parcours' },
          ].map(({ href, icon: Icon, label, detail }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-line bg-paper-raised p-3 shadow-[var(--shadow-md)] transition-transform hover:-translate-y-0.5 sm:p-4"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-blue-soft text-blue transition-colors group-hover:bg-blue group-hover:text-on-blue sm:size-11">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm leading-snug font-bold text-ink">{label}</span>
                <span className="block truncate text-xs text-ink-muted">{detail}</span>
              </span>
            </Link>
          ))}
        </nav>

        {missing.length > 0 && (
          <div className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-dashed border-red/50 bg-red-soft/60 p-5 sm:flex-row sm:items-center">
            <p className="flex-1 text-ink">
              <span className="font-hand text-xl text-red">Petit mot :</span> <span className="font-bold">aide les lycéens à te trouver</span> — ajoute {joinFrench(missing)} à ton profil.
            </p>
            <Link href="/profil" className={buttonClasses('primary', 'md', 'shrink-0')}>
              Compléter mon profil
            </Link>
          </div>
        )}

        {subjects.length > 0 && (
          <section aria-labelledby="home-matieres">
            <SectionHeading
              id="home-matieres"
              title="Explorer par matière"
              lead="Choisis une matière qui te plaît et découvre où elle a mené les anciens."
              action={
                <Link href="/annuaire" className="link-ink inline-flex items-center gap-1 font-semibold">
                  Tout l’annuaire <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              }
            />
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
              {subjects.map((subject) => (
                <li key={subject.value}>
                  <Link
                    href={`/annuaire?matiere=${subject.value}`}
                    className="group flex h-full items-center gap-3 rounded-[var(--radius-md)] border border-line bg-paper-raised p-3 transition hover:-translate-y-0.5 hover:border-blue/60 hover:shadow-[var(--shadow-md)] sm:p-4"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-blue-soft text-blue transition-colors group-hover:bg-blue group-hover:text-on-blue" aria-hidden="true">
                      <SubjectIcon value={subject.value} className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block leading-snug font-bold text-ink">{subject.short}</span>
                      <span className="block text-xs text-ink-muted">{plural(subjectCounts.get(subject.value)!, 'profil')}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {cities.length > 0 && (
          <section aria-labelledby="home-villes" className="bg-seyes relative overflow-hidden rounded-[var(--radius-lg)] border border-line p-6 sm:p-10">
            <h2 id="home-villes" className="text-[clamp(1.5rem,2.8vw,2.1rem)] text-ink">
              Où sont-ils passés ?
            </h2>
            <p className="mt-1 text-ink-soft">Les villes où les anciens ont étudié ou travaillé.</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {cities.slice(0, 14).map((city) => (
                <li key={city.name}>
                  <Link
                    href={`/annuaire?ville=${encodeURIComponent(city.name)}`}
                    className="group inline-flex h-10 items-center gap-2 rounded-full border border-line bg-paper-raised pr-2 pl-3 text-sm font-semibold text-ink shadow-[var(--shadow-sm)] transition-colors hover:border-red/60"
                  >
                    <MapPin className="size-4 text-red" aria-hidden="true" />
                    {city.name}
                    <span className="min-w-6 rounded-full bg-paper-sunken px-1.5 py-0.5 text-center text-xs text-ink-soft">{city.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {recentMembers.length > 0 && (
          <section aria-labelledby="home-membres">
            <SectionHeading
              id="home-membres"
              title="Nouveaux membres"
              lead="Ils viennent de rejoindre l’annuaire."
              action={
                <Link href="/annuaire" className="link-ink inline-flex items-center gap-1 font-semibold">
                  Voir l’annuaire <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              }
            />
            <DirectoryGrid className="max-sm:[&>li:nth-child(n+4)]:hidden">
              {recentMembers.map((member) => (
                <li key={member.id}>
                  <DirectoryCard user={toCardUser(member)} showNewBadge isMe={member.id === user.id} />
                </li>
              ))}
            </DirectoryGrid>
          </section>
        )}

        {opportunities.length + testimonials.length + posts.length > 0 && (
          <section aria-labelledby="home-communaute">
            <SectionHeading id="home-communaute" title="Dans la communauté" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {opportunities.length > 0 && (
                <FeedCard title="Opportunités" icon={Briefcase} href="/annonces">
                  {opportunities.map((a) => (
                    <FeedItem key={a.id} href={`/annonces/${a.slug}`} title={a.title} meta={[a.company, a.location].filter(Boolean).join(' · ') || shortDate(a.publishedAt)} />
                  ))}
                </FeedCard>
              )}
              {testimonials.length > 0 && (
                <FeedCard title="Témoignages" icon={MessageSquareQuote} href="/temoignages">
                  {testimonials.map((t) => (
                    <FeedItem
                      key={t.id}
                      href={`/temoignages/${t.slug}`}
                      title={t.title}
                      meta={`${t.author?.firstName ?? ''} ${t.author?.lastName ?? ''}${t.author?.promotionYear ? ` · Promo ${t.author.promotionYear}` : ''}`}
                    />
                  ))}
                </FeedCard>
              )}
              {posts.length > 0 && (
                <FeedCard title="Articles" icon={Newspaper} href="/blog">
                  {posts.map((post) => (
                    <FeedItem key={post.id} href={`/blog/${post.slug}`} title={post.title} meta={shortDate(post.publishedAt)} />
                  ))}
                </FeedCard>
              )}
            </div>
          </section>
        )}
      </div>
    </EditableArea>
  )
}

function FeedCard({ title, icon: Icon, href, children }: { title: string; icon: typeof Search; href: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 font-sans text-lg font-bold text-ink">
          <span className="grid size-8 place-items-center rounded-[var(--radius-sm)] bg-highlight text-on-highlight" aria-hidden="true">
            <Icon className="size-4" />
          </span>
          {title}
        </h3>
        <Link href={href} className="link-ink text-sm font-semibold">
          Tout voir<span className="sr-only"> : {title.toLowerCase()}</span>
        </Link>
      </div>
      <ul className="-mx-2 divide-y divide-line">{children}</ul>
    </div>
  )
}

function FeedItem({ href, title, meta }: { href: string; title: string; meta: string }) {
  return (
    <li>
      <Link href={href} className="block rounded-[var(--radius-sm)] px-2 py-3 transition-colors hover:bg-paper-sunken">
        <span className="line-clamp-2 block text-sm font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-ink-muted">{meta}</span>
      </Link>
    </li>
  )
}
