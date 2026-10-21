import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Briefcase, GraduationCap, Mail, MapPin, PenLine, Plus } from 'lucide-react'
import { requireMemberPage } from '@/lib/auth/session'
import { getMemberProfile } from '@/lib/data/users'
import { listPublishedTestimonialsByAuthor } from '@/lib/data/testimonials'
import { getCurrentCity } from '@/lib/directorySearch'
import { getMostRecentActivity } from '@/lib/userUtils'
import { getSubject } from '@/lib/subjects'
import { formatLinkedInUrl, USER_TYPE_LABELS } from '@/lib/utils'
import { Avatar } from '@/app/components/ui/Avatar'
import { Picture } from '@/app/components/ui/Picture'
import { SubjectIcon } from '@/app/components/ui/icons'
import { buttonClasses } from '@/app/components/ui/Button'
import { TestimonialCard } from '@/app/components/testimonials/TestimonialCard'
import { toCardUser } from '@/app/components/directory/toCardUser'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const member = await getMemberProfile((await params).id)
  return { title: member ? `${member.firstName} ${member.lastName}` : 'Membre introuvable', robots: { index: false } }
}

function monthYear(date: string) {
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const viewer = await requireMemberPage(`/annuaire/${id}`)
  const member = await getMemberProfile(id)
  if (!member) notFound()
  const testimonials = await listPublishedTestimonialsByAuthor(member.id)
  const isOwn = viewer.id === member.id

  const { currentJob, company, currentCity: field, isEducation } = getMostRecentActivity(member)
  const isStaff = member.userType === 'staff'
  const city = getCurrentCity(toCardUser(member))
  const facts = [
    member.promotionYear && { label: 'Promotion', value: String(member.promotionYear), icon: GraduationCap },
    (isStaff ? member.staffDetails : currentJob) && {
      label: isStaff ? 'Fonction' : isEducation ? 'Formation actuelle' : 'Poste actuel',
      value: (isStaff ? member.staffDetails : currentJob)!,
      icon: isStaff || isEducation ? GraduationCap : Briefcase,
    },
    (isStaff || company) && { label: isStaff ? 'Établissement' : isEducation ? 'École' : 'Entreprise', value: isStaff ? 'Lycée Victor Hugo' : company!, icon: isStaff || isEducation ? GraduationCap : Briefcase },
    city && { label: isStaff ? 'Ville' : 'Ville actuelle', value: city, icon: MapPin },
    !isStaff && isEducation && field && { label: 'Domaine', value: field, icon: GraduationCap },
    member.currentStudies && { label: 'Études actuelles', value: member.currentStudies, icon: GraduationCap },
  ].filter(Boolean) as { label: string; value: string; icon: typeof MapPin }[]

  const subjects = member.subjects.map(getSubject).filter((subject) => subject !== undefined)
  const experience = [...member.experience].sort((a, b) => {
    const date = (exp: typeof a) => (exp.current ? Date.now() : new Date(exp.endDate || exp.startDate).getTime())
    return date(b) - date(a)
  })
  const education = [...member.education].sort((a, b) => (b.endYear ?? 9999) - (a.endYear ?? 9999) || b.startYear - a.startYear)

  return (
    <div>
      {/* Couverture */}
      <div className="relative h-44 overflow-hidden sm:h-64">
        {member.coverImage ? <Picture image={member.coverImage} alt="" sizes="100vw" priority /> : <div className="bg-wash absolute inset-0" />}
      </div>

      <div className="container-page relative -mt-20 pb-16 sm:-mt-24">
        <Link href="/annuaire" className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-paper-raised px-3 py-1.5 text-sm font-semibold text-ink shadow-[var(--shadow-md)] hover:text-blue">
          <ArrowLeft className="size-4" aria-hidden="true" /> Retour à l’annuaire
        </Link>

        <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
          <aside className="self-start rounded-[var(--radius-lg)] border border-line bg-paper-raised p-6 shadow-[var(--shadow-md)] lg:sticky lg:top-20">
            <div className="text-center">
              <Avatar firstName={member.firstName} lastName={member.lastName} image={member.profileImage} seed={member.id} size="xl" className="ring-4 ring-paper-raised" decorative={false} />
              <h1 className="mt-4 font-display-tight text-3xl text-ink">
                {member.firstName} {member.lastName}
              </h1>
              <p className="mt-1 font-semibold text-red-strong">{USER_TYPE_LABELS[member.userType] ?? 'Membre'}</p>
              {subjects.length > 0 && (
                <ul className="mt-4 flex flex-wrap justify-center gap-1.5" aria-label="Matières">
                  {subjects.map((subject) => (
                    <li key={subject.value}>
                      <Link
                        href={`/annuaire?matiere=${subject.value}`}
                        className="inline-flex items-center gap-1 rounded-full bg-paper-sunken px-2.5 py-1 text-xs font-semibold text-ink-soft hover:bg-highlight hover:text-on-highlight"
                      >
                        <SubjectIcon value={subject.value} className="size-3.5" />
                        {subject.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {facts.length > 0 && (
              <dl className="mt-6 space-y-3 border-t border-line pt-5">
                {facts.map(({ label, value, icon: Icon }) => (
                  // dl > div > dt + dd uniquement : l'icône est placée dans le dt
                  <div key={label} className="relative min-w-0 pl-8">
                    <dt className="text-xs font-semibold text-ink-muted">
                      <Icon className="absolute top-0.5 left-0 size-5 text-blue" aria-hidden="true" />
                      {label}
                    </dt>
                    <dd className="font-semibold break-words text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-6 space-y-2.5 border-t border-line pt-5">
              <a href={`mailto:${member.email}`} className={buttonClasses('primary', 'md', 'w-full')}>
                <Mail className="size-4" aria-hidden="true" /> Écrire à {member.firstName}
              </a>
              {member.linkedIn && (
                <a href={formatLinkedInUrl(member.linkedIn)} target="_blank" rel="noopener noreferrer" className={buttonClasses('secondary', 'md', 'w-full')}>
                  Profil LinkedIn <span className="sr-only">(nouvel onglet)</span>
                </a>
              )}
              {isOwn && (
                <Link href="/profil" className={buttonClasses('ghost', 'md', 'w-full')}>
                  <PenLine className="size-4" aria-hidden="true" /> Modifier mon profil
                </Link>
              )}
              <p className="text-center text-xs text-ink-muted break-all">{member.email}</p>
            </div>
          </aside>

          <div className="space-y-6">
            {member.bio && (
              <section className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-6 sm:p-8" aria-labelledby="bio">
                <h2 id="bio" className="text-2xl text-ink">
                  À propos
                </h2>
                <p className="mt-3 whitespace-pre-line text-ink-soft">{member.bio}</p>
              </section>
            )}

            <Timeline
              title="Expérience professionnelle"
              empty="Aucune expérience professionnelle pour le moment"
              addLabel={isOwn ? 'Ajouter une expérience' : undefined}
              items={experience.map((exp, index) => ({
                key: exp._key ?? String(index),
                title: exp.position,
                meta: [exp.company, exp.location].filter(Boolean).join(' · '),
                period: `${monthYear(exp.startDate)} – ${exp.current ? 'aujourd’hui' : exp.endDate ? monthYear(exp.endDate) : ''}`,
                current: !!exp.current,
                description: exp.description,
              }))}
            />
            <Timeline
              title="Formation"
              empty="Aucune formation pour le moment"
              addLabel={isOwn ? 'Ajouter une formation' : undefined}
              items={education.map((edu, index) => ({
                key: edu._key ?? String(index),
                title: edu.degree,
                meta: [edu.school, edu.location, edu.field].filter(Boolean).join(' · '),
                period: `${edu.startYear} – ${edu.endYear ?? 'en cours'}`,
                current: !edu.endYear,
                description: edu.description,
              }))}
            />

            <section className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-6 sm:p-8" aria-labelledby="temoignages">
              <h2 id="temoignages" className="flex items-center gap-2 text-2xl text-ink">
                Témoignages de {member.firstName}
                {testimonials.length > 0 && <span className="rounded-full bg-blue-soft px-2.5 py-0.5 font-sans text-sm font-bold text-blue">{testimonials.length}</span>}
              </h2>
              {testimonials.length > 0 ? (
                <ul className="mt-5 grid gap-4 md:grid-cols-2">
                  {testimonials.map((testimonial) => (
                    <li key={testimonial.id}>
                      <TestimonialCard testimonial={testimonial} />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4 text-ink-muted">
                  Aucun témoignage pour le moment.
                  {isOwn && (
                    <Link href="/temoignages/nouveau" className="link-ink ml-2 font-semibold">
                      Écrire un témoignage
                    </Link>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function Timeline({
  title,
  empty,
  addLabel,
  items,
}: {
  title: string
  empty: string
  addLabel?: string
  items: { key: string; title: string; meta: string; period: string; current: boolean; description?: string }[]
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-6 sm:p-8">
      <h2 className="text-2xl text-ink">{title}</h2>
      {items.length > 0 ? (
        <ol className="relative mt-6 space-y-7 border-l-2 border-red/40 pl-6">
          {items.map((item) => (
            <li key={item.key} className="relative">
              <span aria-hidden="true" className={`absolute top-1.5 -left-[31px] size-3.5 rounded-full border-2 border-paper-raised ${item.current ? 'bg-red' : 'bg-line-strong'}`} />
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <h3 className="font-sans text-lg font-bold break-words text-ink">{item.title}</h3>
                <p className="shrink-0 text-sm text-ink-muted">{item.period}</p>
              </div>
              {item.meta && <p className="font-semibold text-ink-soft">{item.meta}</p>}
              {item.description && <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{item.description}</p>}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-ink-muted">
          {empty}
          {addLabel && (
            <Link href="/profil" className="link-ink ml-2 inline-flex items-center gap-1 font-semibold">
              <Plus className="size-4" aria-hidden="true" /> {addLabel}
            </Link>
          )}
        </p>
      )}
    </section>
  )
}
