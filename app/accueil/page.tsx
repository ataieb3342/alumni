import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  Briefcase,
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
} from '@/sanity/lib/queries'
import { indexMember, suggestCities } from '@/lib/directorySearch'
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

interface Testimonial {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  author: { firstName: string; lastName: string; promotionYear?: string }
}

function plural(count: number, word: string) {
  return `${count} ${word}${count > 1 ? 's' : ''}`
}

function joinFrench(items: string[]): string {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default async function AccueilPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/connexion')
  }

  const [members, recentMembers, recentPosts, recentAnnouncements, popularTestimonials] = await Promise.all([
    client.fetch<DirectoryUser[]>(directoryUsersQuery),
    client.fetch<DirectoryUser[]>(recentMembersQuery),
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

  const firstName = session.user.firstName || session.user.name?.split(' ')[0]
  const isLyceen = session.user.userType === 'lyceen'
  const hasCommunity = recentAnnouncements.length + popularTestimonials.length + recentPosts.length > 0

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        {/* Hero : la recherche dans l'annuaire est l'action principale */}
        <section className="relative isolate overflow-hidden bg-blue-950 text-white">
          <Image
            src="/images/lycee-victor-hugo.jpg"
            alt=""
            fill
            priority
            className="object-cover object-bottom opacity-25 -z-10"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-950/40 via-blue-950/70 to-blue-950" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-24 sm:pt-16 sm:pb-28">
            <p className="text-sm sm:text-base font-medium text-blue-200">
              {firstName ? `Bonjour ${firstName} 👋` : 'Bonjour 👋'}
            </p>
            <h1 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] text-balance">
              {isLyceen
                ? 'Trouve un ancien qui a fait ce qui te tente'
                : 'Qui est passé par là avant toi ?'}
            </h1>
            <p className="mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg text-blue-100/90 text-pretty">
              {plural(members.length, 'membre')} du lycée Victor Hugo racontent leur parcours.
              Cherche une école, un métier, une ville ou une matière.
            </p>

            <form action="/annuaire" method="get" role="search" className="mt-6 sm:mt-8">
              <label htmlFor="home-search" className="sr-only">Rechercher dans l&apos;annuaire</label>
              <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 sm:p-2 shadow-2xl shadow-blue-950/40 ring-1 ring-white/10 focus-within:ring-4 focus-within:ring-blue-400/40">
                <Search className="ml-2.5 sm:ml-3 w-5 h-5 shrink-0 text-gray-400" aria-hidden="true" />
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
                  className="shrink-0 inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-4 sm:px-6 rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
                >
                  <span className="hidden min-[400px]:inline">Chercher</span>
                  <ArrowRight className="w-5 h-5 min-[400px]:hidden" aria-hidden="true" />
                  <span className="sr-only min-[400px]:hidden">Chercher</span>
                </button>
              </div>
            </form>

            {subjects.length > 0 && (
              <div className="mt-4 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                <span className="shrink-0 text-sm text-blue-200">Populaires :</span>
                {[...subjects]
                  .sort((a, b) => subjectCounts.get(b.value)! - subjectCounts.get(a.value)!)
                  .slice(0, 5)
                  .map((subject) => (
                    <Link
                      key={subject.value}
                      href={`/annuaire?matiere=${subject.value}`}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-sm font-medium text-white ring-1 ring-white/15 hover:bg-white/20 transition-colors"
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
            <QuickLink href="/annuaire" icon={Compass} label="Parcourir l'annuaire" detail={plural(members.length, 'profil')} />
            <QuickLink href="/profil" icon={UserRoundPen} label="Mon profil" detail={missing.length ? 'À compléter' : 'Modifier'} />
            <QuickLink href="/annonces/nouvelle" icon={Briefcase} label="Poster une annonce" detail="Stages, jobs" />
            <QuickLink href="/temoignages/nouveau" icon={PenLine} label="Écrire un témoignage" detail="Ton parcours" />
          </nav>

          {missing.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-amber-50 border border-amber-200 p-4 sm:p-5">
              <span className="hidden sm:flex w-11 h-11 shrink-0 rounded-xl bg-amber-100 text-amber-700 items-center justify-center" aria-hidden="true">
                <Sparkles className="w-5 h-5" />
              </span>
              <p className="flex-1 text-sm sm:text-base text-amber-950">
                <span className="font-semibold">Aide les lycéens à te trouver :</span>{' '}
                ajoute {joinFrench(missing)} à ton profil.
              </p>
              <Link
                href="/profil"
                className="shrink-0 inline-flex items-center justify-center h-10 px-4 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors"
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
                {subjects.map((subject) => (
                  <li key={subject.value}>
                    <Link
                      href={`/annuaire?matiere=${subject.value}`}
                      className="group flex h-full items-center gap-2.5 sm:gap-3 rounded-2xl bg-white border border-gray-200 p-2.5 sm:p-4 hover:border-blue-300 hover:shadow-md transition"
                    >
                      <span className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center text-lg sm:text-xl" aria-hidden="true">
                        {subject.emoji}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm sm:text-base font-semibold leading-snug text-gray-900 group-hover:text-blue-700 transition-colors">
                          {subject.short}
                        </span>
                        <span className="block text-xs text-gray-500">{plural(subjectCounts.get(subject.value)!, 'profil')}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Explorer par ville */}
          {cities.length > 0 && (
            <section aria-labelledby="home-villes">
              <SectionHeader
                id="home-villes"
                title="Où sont-ils passés ?"
                subtitle="Les villes où les anciens ont étudié ou travaillé."
              />
              <ul className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 pb-1 sm:mx-0 sm:px-0 sm:flex-wrap">
                {cities.slice(0, 14).map((city) => (
                  <li key={city.name} className="shrink-0">
                    <Link
                      href={`/annuaire?ville=${encodeURIComponent(city.name)}`}
                      className="inline-flex items-center gap-2 h-10 pl-3 pr-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-800 hover:border-blue-300 hover:text-blue-700 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-rose-500" aria-hidden="true" />
                      {city.name}
                      <span className="min-w-6 px-1.5 py-0.5 rounded-full bg-slate-100 text-xs text-gray-600 text-center">{city.count}</span>
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
                {recentAnnouncements.length > 0 && (
                  <FeedCard title="Opportunités" icon={Briefcase} href="/annonces">
                    {recentAnnouncements.slice(0, 3).map((announcement) => (
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
                  <FeedCard title="Témoignages" icon={MessageSquareQuote} href="/temoignages">
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
                  <FeedCard title="Articles" icon={Newspaper} href="/blog">
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

function QuickLink({ href, icon: Icon, label, detail }: { href: string; icon: Icon; label: string; detail: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl bg-white p-3 sm:p-4 shadow-lg shadow-slate-900/5 ring-1 ring-gray-200 hover:ring-blue-300 hover:shadow-xl transition"
    >
      <span className="w-10 h-10 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors" aria-hidden="true">
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
          className="group shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
        >
          <span className="hidden sm:inline">{linkLabel}</span>
          <span className="sm:hidden">Tout voir</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

function FeedCard({ title, icon: Icon, href, children }: { title: string; icon: Icon; href: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-2xl bg-white border border-gray-200 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="flex items-center gap-2 font-semibold text-gray-900">
          <Icon className="w-4 h-4 text-gray-400" aria-hidden="true" />
          {title}
        </h3>
        <Link href={href} className="text-sm font-medium text-blue-700 hover:text-blue-800">
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
      <Link href={href} className="block rounded-lg px-2 py-3 hover:bg-slate-50 transition-colors">
        <span className="block text-sm font-medium text-gray-900 line-clamp-2">{title}</span>
        <span className="mt-0.5 block text-xs text-gray-500 truncate">{meta}</span>
      </Link>
    </li>
  )
}
