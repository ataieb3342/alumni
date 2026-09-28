import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  Clock,
  Compass,
  MapPin,
  MessageSquareQuote,
  Newspaper,
  PenLine,
  Search,
  Sparkles,
  UserRoundPen,
} from 'lucide-react'
import { auth } from '@/lib/auth'
import { client } from '@/sanity/lib/client'
import {
  directoryUsersQuery,
  recentPostsQuery,
  recentAnnouncementsQuery,
  popularTestimonialsQuery,
  recentMembersQuery,
  upcomingEventsQuery,
} from '@/sanity/lib/queries'
import { indexMember, suggestCities } from '@/lib/directorySearch'
import { eventCountdown, eventDateParts, formatEventDate, formatEventTime } from '@/lib/eventDate'
import { SUBJECTS } from '@/lib/subjects'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import DirectoryCard, { type DirectoryUser } from '@/app/components/DirectoryCard'

interface Post {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
}

interface Announcement {
  _id: string
  title: string
  slug: { current: string }
  company?: string
  location?: string
  publishedAt: string
}

interface UpcomingEvent {
  _id: string
  title: string
  slug: { current: string }
  company?: string
  location?: string
  eventDate: string
}

interface Testimonial {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  author: { firstName: string; lastName: string; promotionYear?: string }
}

// Une couleur par matière : la grille se lit d'un coup d'œil au lieu d'un mur de cartes blanches
const SUBJECT_COLORS: Record<string, { icon: string; hover: string }> = {
  maths: { icon: 'bg-blue-100', hover: 'hover:border-blue-300 hover:bg-blue-50/60' },
  physique: { icon: 'bg-violet-100', hover: 'hover:border-violet-300 hover:bg-violet-50/60' },
  chimie: { icon: 'bg-emerald-100', hover: 'hover:border-emerald-300 hover:bg-emerald-50/60' },
  biologie: { icon: 'bg-lime-100', hover: 'hover:border-lime-300 hover:bg-lime-50/60' },
  sante: { icon: 'bg-rose-100', hover: 'hover:border-rose-300 hover:bg-rose-50/60' },
  informatique: { icon: 'bg-sky-100', hover: 'hover:border-sky-300 hover:bg-sky-50/60' },
  ingenierie: { icon: 'bg-orange-100', hover: 'hover:border-orange-300 hover:bg-orange-50/60' },
  economie: { icon: 'bg-amber-100', hover: 'hover:border-amber-300 hover:bg-amber-50/60' },
  droit: { icon: 'bg-indigo-100', hover: 'hover:border-indigo-300 hover:bg-indigo-50/60' },
  histoire: { icon: 'bg-yellow-100', hover: 'hover:border-yellow-300 hover:bg-yellow-50/60' },
  psychologie: { icon: 'bg-pink-100', hover: 'hover:border-pink-300 hover:bg-pink-50/60' },
  litterature: { icon: 'bg-red-100', hover: 'hover:border-red-300 hover:bg-red-50/60' },
  philosophie: { icon: 'bg-purple-100', hover: 'hover:border-purple-300 hover:bg-purple-50/60' },
  langues: { icon: 'bg-teal-100', hover: 'hover:border-teal-300 hover:bg-teal-50/60' },
  arts: { icon: 'bg-fuchsia-100', hover: 'hover:border-fuchsia-300 hover:bg-fuchsia-50/60' },
  sport: { icon: 'bg-green-100', hover: 'hover:border-green-300 hover:bg-green-50/60' },
}

function plural(count: number, word: string) {
  return `${count} ${word}${count > 1 ? 's' : ''}`
}

function joinFrench(items: string[]): string {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' })
}

export default async function AccueilPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/connexion')
  }

  const [members, recentMembers, upcomingEvents, recentPosts, recentAnnouncements, popularTestimonials] = await Promise.all([
    client.fetch<DirectoryUser[]>(directoryUsersQuery),
    client.fetch<DirectoryUser[]>(recentMembersQuery),
    client.fetch<UpcomingEvent[]>(upcomingEventsQuery),
    client.fetch<Post[]>(recentPostsQuery),
    client.fetch<Announcement[]>(recentAnnouncementsQuery),
    client.fetch<Testimonial[]>(popularTestimonialsQuery),
  ])

  // Mêmes décomptes que l'annuaire, pour que chaque lien tienne sa promesse
  const indexed = members.map(indexMember)
  const subjectCounts = new Map<string, number>()
  for (const member of members) {
    for (const subject of member.subjects ?? []) {
      subjectCounts.set(subject, (subjectCounts.get(subject) ?? 0) + 1)
    }
  }
  const subjects = SUBJECTS.filter((subject) => subjectCounts.get(subject.value))
  const cities = suggestCities(indexed, 'any')

  // Ce qu'il manque au profil du visiteur pour qu'on le trouve (les lycéens ne sont pas dans l'annuaire)
  const me = indexed.find((entry) => entry.member.email === session.user.email)
  const missing = me
    ? [
        !me.summary.city && 'ta ville',
        !me.member.subjects?.length && 'tes matières',
        !me.summary.headline && 'ton poste ou tes études',
        me.member.userType !== 'staff' && !me.member.promotionYear && 'ta promo',
      ].filter((item): item is string => !!item)
    : []

  const [nextEvent, ...laterEvents] = upcomingEvents
  // L'événement mis en avant en haut n'a pas besoin de réapparaître dans les opportunités
  const opportunities = recentAnnouncements.filter((a) => !upcomingEvents.some((e) => e._id === a._id))

  const firstName = session.user.firstName || session.user.name?.split(' ')[0]
  const isLyceen = session.user.userType === 'lyceen'
  const hasCommunity = opportunities.length + popularTestimonials.length + recentPosts.length > 0

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        {/* Hero : la recherche dans l'annuaire est l'action principale */}
        <section className="relative isolate overflow-hidden bg-indigo-950 text-white">
          <Image
            src="/images/lycee-victor-hugo.jpg"
            alt=""
            fill
            priority
            className="object-cover object-bottom opacity-20 -z-20"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-950/80 via-indigo-900/80 to-violet-900/90" />
          {/* Halos de couleur */}
          <div aria-hidden="true" className="absolute -top-24 -left-24 -z-10 w-80 h-80 rounded-full bg-sky-400/30 blur-3xl" />
          <div aria-hidden="true" className="absolute top-1/3 -right-24 -z-10 w-96 h-96 rounded-full bg-fuchsia-500/25 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-32 left-1/3 -z-10 w-96 h-72 rounded-full bg-amber-300/15 blur-3xl" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24 sm:pt-10 sm:pb-28">
            {nextEvent && <EventBanner event={nextEvent} others={laterEvents} />}

            <div className={nextEvent ? 'mt-8 sm:mt-10' : 'sm:pt-6'}>
              <p className="text-sm sm:text-base font-medium text-sky-200">
                {firstName ? `Bonjour ${firstName} 👋` : 'Bonjour 👋'}
              </p>
              <h1 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] text-balance">
                {isLyceen ? (
                  <>
                    Trouve un ancien qui a fait{' '}
                    <span className="bg-gradient-to-r from-sky-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">ce qui te tente</span>
                  </>
                ) : (
                  <>
                    Qui est passé par là{' '}
                    <span className="bg-gradient-to-r from-sky-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">avant toi ?</span>
                  </>
                )}
              </h1>
              <p className="mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-indigo-100/90 text-pretty">
                {plural(members.length, 'membre')} du lycée Victor Hugo racontent leur parcours.
                Cherche une école, un métier, une ville ou une matière.
              </p>
            </div>

            <form action="/annuaire" method="get" role="search" className="mt-6 sm:mt-8">
              <label htmlFor="home-search" className="sr-only">Rechercher dans l&apos;annuaire</label>
              <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 sm:p-2 shadow-2xl shadow-indigo-950/50 ring-1 ring-white/20 focus-within:ring-4 focus-within:ring-sky-300/50">
                <Search className="ml-2.5 sm:ml-3 w-5 h-5 shrink-0 text-indigo-400" aria-hidden="true" />
                <input
                  id="home-search"
                  name="q"
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  placeholder="Médecine, INSA, Lyon, développeur…"
                  className="min-w-0 flex-1 h-11 sm:h-12 bg-transparent text-base text-gray-900 placeholder:text-gray-500 outline-none [&::-webkit-search-cancel-button]:hidden"
                />
                <button
                  type="submit"
                  className="shrink-0 inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-blue-700 hover:to-indigo-700 transition-colors"
                >
                  <span className="hidden min-[400px]:inline">Chercher</span>
                  <ArrowRight className="w-5 h-5 min-[400px]:hidden" aria-hidden="true" />
                  <span className="sr-only min-[400px]:hidden">Chercher</span>
                </button>
              </div>
            </form>

            {subjects.length > 0 && (
              <div className="mt-4 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                <span className="shrink-0 text-sm text-indigo-200">Populaires :</span>
                {[...subjects]
                  .sort((a, b) => subjectCounts.get(b.value)! - subjectCounts.get(a.value)!)
                  .slice(0, 5)
                  .map((subject) => (
                    <Link
                      key={subject.value}
                      href={`/annuaire?matiere=${subject.value}`}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium text-white ring-1 ring-white/20 hover:bg-white hover:text-indigo-700 transition-colors"
                    >
                      <span aria-hidden="true">{subject.emoji}</span>
                      {subject.short}
                    </Link>
                  ))}
              </div>
            )}
          </div>
        </section>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 -mt-14 sm:-mt-16 pb-16 space-y-12 sm:space-y-16">
          {/* Raccourcis */}
          <nav aria-label="Raccourcis" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickLink href="/annuaire" icon={Compass} tint="from-blue-500 to-indigo-600 shadow-indigo-500/30" label="Parcourir l'annuaire" detail={plural(members.length, 'profil')} />
            <QuickLink href="/profil" icon={UserRoundPen} tint="from-emerald-400 to-teal-600 shadow-teal-500/30" label="Mon profil" detail={missing.length ? 'À compléter' : 'Modifier'} />
            <QuickLink href="/annonces/nouvelle" icon={Briefcase} tint="from-amber-400 to-orange-500 shadow-orange-500/30" label="Poster une annonce" detail="Stages, jobs" />
            <QuickLink href="/temoignages/nouveau" icon={PenLine} tint="from-fuchsia-500 to-violet-600 shadow-violet-500/30" label="Écrire un témoignage" detail="Ton parcours" />
          </nav>

          {missing.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 sm:p-5 shadow-sm">
              <span className="hidden sm:flex w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/30 items-center justify-center" aria-hidden="true">
                <Sparkles className="w-5 h-5" />
              </span>
              <p className="flex-1 text-sm sm:text-base text-amber-950">
                <span className="font-semibold">Aide les lycéens à te trouver :</span>{' '}
                ajoute {joinFrench(missing)} à ton profil.
              </p>
              <Link
                href="/profil"
                className="shrink-0 inline-flex items-center justify-center h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow-md shadow-orange-500/25 hover:from-amber-600 hover:to-orange-600 transition-colors"
              >
                Compléter mon profil
              </Link>
            </div>
          )}

          {/* Explorer par matière */}
          {subjects.length > 0 && (
            <section aria-labelledby="home-matieres">
              <SectionHeader
                id="home-matieres"
                title="Explorer par matière"
                subtitle="Choisis une matière qui te plaît et découvre où elle a mené les anciens."
                href="/annuaire"
                linkLabel="Tout l'annuaire"
              />
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                {subjects.map((subject) => {
                  const color = SUBJECT_COLORS[subject.value] ?? SUBJECT_COLORS.maths
                  return (
                    <li key={subject.value}>
                      <Link
                        href={`/annuaire?matiere=${subject.value}`}
                        className={`group flex h-full items-center gap-2.5 sm:gap-3 rounded-2xl bg-white border border-gray-200 p-2.5 sm:p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition ${color.hover}`}
                      >
                        <span className={`w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-xl flex items-center justify-center text-lg sm:text-xl group-hover:scale-110 transition-transform ${color.icon}`} aria-hidden="true">
                          {subject.emoji}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm sm:text-base font-semibold leading-snug text-gray-900">
                            {subject.short}
                          </span>
                          <span className="block text-xs text-gray-500">{plural(subjectCounts.get(subject.value)!, 'profil')}</span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* Explorer par ville */}
          {cities.length > 0 && (
            <section
              aria-labelledby="home-villes"
              className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-5 sm:p-8 text-white shadow-xl shadow-blue-600/20"
            >
              <div aria-hidden="true" className="absolute -top-16 -right-10 -z-10 w-64 h-64 rounded-full bg-fuchsia-400/30 blur-3xl" />
              <div aria-hidden="true" className="absolute -bottom-20 -left-10 -z-10 w-72 h-72 rounded-full bg-sky-300/30 blur-3xl" />
              <MapPin aria-hidden="true" className="absolute -right-6 -bottom-8 -z-10 w-48 h-48 sm:w-64 sm:h-64 text-white/10 rotate-12" strokeWidth={1.25} />

              <div className="mb-5">
                <h2 id="home-villes" className="text-xl sm:text-2xl font-bold tracking-tight">Où sont-ils passés ?</h2>
                <p className="mt-1 text-sm text-blue-100">Les villes où les anciens ont étudié ou travaillé.</p>
              </div>
              <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-5 px-5 pb-1 sm:mx-0 sm:px-0 sm:flex-wrap">
                {cities.slice(0, 14).map((city) => (
                  <li key={city.name} className="shrink-0">
                    <Link
                      href={`/annuaire?ville=${encodeURIComponent(city.name)}`}
                      className="group inline-flex items-center gap-2 h-10 pl-3 pr-2 rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/25 text-sm font-medium hover:bg-white hover:text-indigo-700 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-amber-200 group-hover:text-rose-500" aria-hidden="true" />
                      {city.name}
                      <span className="min-w-6 px-1.5 py-0.5 rounded-full bg-white/20 text-xs text-center group-hover:bg-indigo-100">{city.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Nouveaux membres */}
          {recentMembers.length > 0 && (
            <section aria-labelledby="home-membres">
              <SectionHeader
                id="home-membres"
                title="Nouveaux membres"
                subtitle="Ils viennent de rejoindre l'annuaire."
                href="/annuaire"
                linkLabel="Voir l'annuaire"
              />
              {/* Trois cartes suffisent sur mobile, où elles s'empilent */}
              <div className="max-sm:[&>div>a:nth-child(n+4)]:hidden">
                <DirectoryCard users={recentMembers} showNewBadge currentUserId={me?.member._id} />
              </div>
            </section>
          )}

          {/* Le reste de la vie de la communauté, en secondaire */}
          {hasCommunity && (
            <section aria-labelledby="home-communaute">
              <SectionHeader id="home-communaute" title="Dans la communauté" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {opportunities.length > 0 && (
                  <FeedCard title="Opportunités" icon={Briefcase} tint="from-amber-400 to-orange-500" wash="from-amber-50" href="/annonces">
                    {opportunities.slice(0, 3).map((announcement) => (
                      <FeedItem
                        key={announcement._id}
                        href={`/annonces/${announcement.slug.current}`}
                        title={announcement.title}
                        meta={[announcement.company, announcement.location].filter(Boolean).join(' · ') || formatDate(announcement.publishedAt)}
                      />
                    ))}
                  </FeedCard>
                )}
                {popularTestimonials.length > 0 && (
                  <FeedCard title="Témoignages" icon={MessageSquareQuote} tint="from-fuchsia-500 to-violet-600" wash="from-violet-50" href="/temoignages">
                    {popularTestimonials.slice(0, 3).map((testimonial) => (
                      <FeedItem
                        key={testimonial._id}
                        href={`/temoignages/${testimonial.slug.current}`}
                        title={testimonial.title}
                        meta={`${testimonial.author.firstName} ${testimonial.author.lastName}${testimonial.author.promotionYear ? ` · Promo ${testimonial.author.promotionYear}` : ''}`}
                      />
                    ))}
                  </FeedCard>
                )}
                {recentPosts.length > 0 && (
                  <FeedCard title="Articles" icon={Newspaper} tint="from-sky-400 to-blue-600" wash="from-sky-50" href="/blog">
                    {recentPosts.slice(0, 3).map((post) => (
                      <FeedItem
                        key={post._id}
                        href={`/blog/${post.slug.current}`}
                        title={post.title}
                        meta={formatDate(post.publishedAt)}
                      />
                    ))}
                  </FeedCard>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

type Icon = typeof Search

/** Le prochain événement, en grand : c'est la première chose à voir quand il y en a un */
function EventBanner({ event, others }: { event: UpcomingEvent; others: UpcomingEvent[] }) {
  const { day, month } = eventDateParts(event.eventDate)
  const place = event.location || event.company

  return (
    <div>
      <Link
        href={`/annonces/${event.slug.current}`}
        className="group relative isolate flex items-center gap-4 sm:gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 p-4 sm:p-6 text-white shadow-2xl shadow-orange-900/40 ring-1 ring-white/30 hover:-translate-y-0.5 hover:shadow-orange-700/50 transition"
      >
        <div aria-hidden="true" className="absolute -top-20 -right-10 -z-10 w-64 h-64 rounded-full bg-yellow-200/40 blur-3xl" />
        <CalendarDays aria-hidden="true" className="absolute -right-8 -bottom-10 -z-10 w-44 h-44 sm:w-56 sm:h-56 text-white/15 -rotate-12" strokeWidth={1.25} />

        <div className="shrink-0 w-16 sm:w-24 overflow-hidden rounded-2xl bg-white text-center shadow-lg shadow-rose-900/20">
          <div className="bg-rose-600 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider">{month.replace('.', '')}</div>
          <div className="py-1.5 sm:py-3 text-3xl sm:text-5xl font-black leading-none text-gray-900">{day}</div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white/90">Prochain événement</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-xs font-bold text-rose-600 shadow-sm">
              <span className="relative flex w-2 h-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-rose-500" />
              </span>
              {eventCountdown(event.eventDate)}
            </span>
          </div>
          <h2 className="mt-1.5 text-lg sm:text-3xl font-black leading-tight text-balance drop-shadow-sm line-clamp-3">
            {event.title}
          </h2>
          <p className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-white/95">
            <span className="inline-flex items-center gap-1.5 first-letter:uppercase">
              <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="sm:hidden">{formatEventTime(event.eventDate)}</span>
              <span className="hidden sm:inline first-letter:uppercase">{formatEventDate(event.eventDate)}</span>
            </span>
            {place && (
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{place}</span>
              </span>
            )}
          </p>
        </div>

        <span className="hidden sm:flex shrink-0 w-12 h-12 rounded-full bg-white text-rose-600 items-center justify-center shadow-lg group-hover:translate-x-1 transition-transform" aria-hidden="true">
          <ArrowRight className="w-6 h-6" />
        </span>
      </Link>

      {others.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          <li className="text-indigo-200 self-center">Aussi à venir :</li>
          {others.map((other) => (
            <li key={other._id}>
              <Link
                href={`/annonces/${other.slug.current}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 ring-1 ring-white/20 font-medium hover:bg-white hover:text-indigo-700 transition-colors"
              >
                <span className="text-amber-200 font-semibold">{formatDate(other.eventDate)}</span>
                <span className="max-w-[16rem] truncate">{other.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function QuickLink({ href, icon: Icon, tint, label, detail }: { href: string; icon: Icon; tint: string; label: string; detail: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl bg-white p-3 sm:p-4 shadow-xl shadow-slate-900/10 ring-1 ring-gray-200/80 hover:-translate-y-0.5 hover:shadow-2xl transition"
    >
      <span className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-xl bg-gradient-to-br text-white shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform ${tint}`} aria-hidden="true">
        <Icon className="w-5 h-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-snug text-gray-900">{label}</span>
        <span className="block text-xs text-gray-500 truncate">{detail}</span>
      </span>
    </Link>
  )
}

function SectionHeader({
  id,
  title,
  subtitle,
  href,
  linkLabel,
}: {
  id: string
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="mb-4 sm:mb-5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 id={id} className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="group shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <span className="hidden sm:inline">{linkLabel}</span>
          <span className="sm:hidden">Tout voir</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

function FeedCard({
  title,
  icon: Icon,
  tint,
  wash,
  href,
  children,
}: {
  title: string
  icon: Icon
  tint: string
  wash: string
  href: string
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col rounded-2xl bg-gradient-to-b ${wash} to-white to-40% border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="flex items-center gap-2.5 font-semibold text-gray-900">
          <span className={`w-8 h-8 rounded-lg bg-gradient-to-br text-white shadow-md flex items-center justify-center ${tint}`} aria-hidden="true">
            <Icon className="w-4 h-4" />
          </span>
          {title}
        </h3>
        <Link href={href} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          Tout voir<span className="sr-only"> : {title.toLowerCase()}</span>
        </Link>
      </div>
      <ul className="-mx-2 divide-y divide-gray-100">{children}</ul>
    </div>
  )
}

function FeedItem({ href, title, meta }: { href: string; title: string; meta: string }) {
  return (
    <li>
      <Link href={href} className="block rounded-lg px-2 py-3 hover:bg-white transition-colors">
        <span className="block text-sm font-medium text-gray-900 line-clamp-2">{title}</span>
        <span className="mt-0.5 block text-xs text-gray-500 truncate">{meta}</span>
      </Link>
    </li>
  )
}
