import type { Metadata } from 'next'
import { ArrowRight, Mail, MapPin, ArrowUpRight, Info } from 'lucide-react'
import { loadPageContent } from '@/lib/content/page'
import { getPublishedContent } from '@/lib/data/content'
import { listBoardMembers, type DirectoryUser } from '@/lib/data/users'
import { getMostRecentActivity } from '@/lib/userUtils'
import { createEditor } from '@/app/components/edit/editor'
import { EditableArea } from '@/app/components/edit/EditableArea'
import { buttonClasses } from '@/app/components/ui/Button'
import { Avatar } from '@/app/components/ui/Avatar'
import { Picture } from '@/app/components/ui/Picture'
import { PageHero, SectionHeading } from '@/app/components/site/PageHero'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'À propos',
  description: "L'association des anciens élèves et personnels du Lycée Victor Hugo de Besançon : histoire, mission, bureau et contact.",
}

// Libellés affichés pour les rôles du bureau (repris de l'ancienne page)
const ROLE_LABELS: Record<string, string> = {
  president: 'Présidente',
  vice_president: 'Vice-président(e)',
  tresorier: 'Trésorier et responsable informatique',
  secretaire_general: 'Secrétaire générale',
  resp_communication: 'Responsable communication',
  resp_evenementiel: 'Responsable événementiel',
  pole_communication: 'Pôle communication',
  resp_informatique: 'Responsable informatique',
  pole_informatique: 'Pôle informatique',
  resp_mailing: 'Responsable mailing list',
}

const ROLE_ORDER = [
  'president',
  'vice_president',
  'secretaire_general',
  'tresorier',
  'resp_informatique',
  'resp_communication',
  'resp_evenementiel',
  'resp_mailing',
  'pole_communication',
  'pole_informatique',
]

function rank(member: DirectoryUser) {
  const ranks = member.roleAssociation.map((role) => ROLE_ORDER.indexOf(role)).filter((i) => i >= 0)
  return ranks.length ? Math.min(...ranks) : 999
}

function currentPosition(member: DirectoryUser): string | null {
  const { currentJob, company, isEducation } = getMostRecentActivity(member)
  if (!currentJob || !company) return null
  return isEducation ? `${currentJob} · ${company}` : `${currentJob} chez ${company}`
}

export default async function AboutPage() {
  const [page, site, board] = await Promise.all([loadPageContent('about'), getPublishedContent('site'), listBoardMembers()])
  const e = createEditor('content:about', page.data, page.editMode, { signedIn: page.signedIn })
  const showJoin = page.editMode || !page.signedIn
  const members = [...board].sort((a, b) => rank(a) - rank(b))

  return (
    <EditableArea docs={[page.doc]}>
      <PageHero
        eyebrow="L'association"
        title={e.text('hero.title', { label: 'Titre de la page' })}
        lead={e.text('hero.lead', { as: 'p', label: 'Chapeau', multiline: true })}
        actions={
          <>
            {e.link('join.cta', { className: buttonClasses('primary', 'lg'), iconRight: <ArrowRight className="size-5" aria-hidden="true" /> })}
            <a href={`mailto:${site.contactEmail}`} className={buttonClasses('secondary', 'lg')}>
              <Mail className="size-5" aria-hidden="true" /> Nous écrire
            </a>
          </>
        }
      />

      {/* Histoire et lycée */}
      <section className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <SectionHeading title={e.text('story.title', { label: 'Titre : histoire' })} />
          {e.rich('story.bodyHtml', { label: 'Texte : histoire', className: 'max-w-prose' })}
        </div>
        <aside className="self-start rounded-[var(--radius-lg)] border border-line bg-paper-raised p-4 shadow-[var(--shadow-sm)] sm:p-6">
          {e.image(
            'school.image',
            (image) =>
              image ? (
                <div className="relative aspect-video overflow-hidden rounded-[var(--radius-md)]">
                  <Picture image={image} sizes="(min-width: 1024px) 30vw, 90vw" />
                </div>
              ) : null,
            { label: 'Photo du lycée', allowRemove: true, className: 'mb-5' }
          )}
          {e.text('school.title', { as: 'h2', label: 'Titre : le lycée', className: 'text-2xl text-ink' })}
          {e.rich('school.bodyHtml', { label: 'Texte : le lycée', className: 'mt-3 text-[0.98rem]' })}
        </aside>
      </section>

      {/* Mission */}
      <section className="bg-paper-sunken py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading title={e.text('mission.title', { label: 'Titre : mission' })} />
          {e.list<{ id: string; icon: string; title: string; text: string }>(
            'mission.items',
            (_item, index, path) => (
              <div className="h-full rounded-[var(--radius-lg)] border border-line bg-paper-raised p-6">
                <span className="mb-4 grid size-11 place-items-center rounded-full bg-highlight text-on-highlight">{e.icon(`${path}.icon`, { className: 'size-5' })}</span>
                {e.text(`${path}.title`, { as: 'h3', label: `Pilier ${index + 1} : titre`, className: 'text-xl text-ink' })}
                {e.text(`${path}.text`, { as: 'p', label: `Pilier ${index + 1} : texte`, multiline: true, className: 'mt-2 text-ink-soft' })}
              </div>
            ),
            { newItem: { icon: 'sparkles', title: 'Nouveau pilier', text: 'Décrivez ce pilier.' }, itemLabel: 'Pilier', className: 'grid gap-5 md:grid-cols-3', max: 6 }
          )}
          {e.rich('mission.bodyHtml', { label: 'Texte : mission', className: 'mt-8 max-w-3xl' })}
        </div>
      </section>

      {/* Bureau : membres ayant un rôle dans l'association */}
      <section aria-labelledby="bureau" className="container-page py-16 sm:py-20">
        <SectionHeading id="bureau" title={e.text('board.title', { label: 'Titre : bureau' })} lead={e.text('board.lead', { as: 'p', label: 'Introduction : bureau', multiline: true })} />
        {page.editMode && (
          <p className="mb-6 flex items-start gap-2 rounded-[var(--radius-md)] bg-blue-soft p-3 text-sm text-ink">
            <Info className="mt-0.5 size-4 shrink-0 text-blue" aria-hidden="true" />
            Les membres du bureau se désignent dans Administration › Membres (« Rôle dans l’association »).
          </p>
        )}
        {members.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member, index) => (
              <li key={member.id} className={index < 2 ? 'lg:col-span-1' : undefined}>
                <article className="flex h-full items-center gap-4 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 transition-shadow hover:shadow-[var(--shadow-md)]">
                  <Avatar firstName={member.firstName} lastName={member.lastName} image={member.profileImage} seed={member.id} size="lg" />
                  <div className="min-w-0">
                    <h3 className="font-sans text-lg font-bold text-ink">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="font-semibold text-red-strong">{ROLE_LABELS[member.roleAssociation[0]] ?? member.roleAssociation[0]}</p>
                    {currentPosition(member) && <p className="mt-1 text-sm text-ink-muted">{currentPosition(member)}</p>}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-muted">Le bureau sera bientôt présenté ici.</p>
        )}
      </section>

      {/* Services */}
      <section className="border-t border-line bg-seyes py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading title={e.text('services.title', { label: 'Titre : services' })} />
          {e.list<{ id: string; icon: string; title: string; text: string }>(
            'services.items',
            (_item, index, path) => (
              <div className="flex h-full gap-4 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] bg-blue text-on-blue">{e.icon(`${path}.icon`, { className: 'size-5' })}</span>
                <div className="min-w-0">
                  {e.text(`${path}.title`, { as: 'h3', label: `Service ${index + 1} : titre`, className: 'text-xl text-ink' })}
                  {e.text(`${path}.text`, { as: 'p', label: `Service ${index + 1} : texte`, multiline: true, className: 'mt-2 text-ink-soft' })}
                </div>
              </div>
            ),
            { newItem: { icon: 'sparkles', title: 'Nouveau service', text: 'Décrivez ce service.' }, itemLabel: 'Service', className: 'grid gap-5 md:grid-cols-2', max: 8 }
          )}
        </div>
      </section>

      {/* Adhésion (visiteurs seulement) et contact */}
      <section className={cn('container-page grid gap-6 py-16 sm:py-20', showJoin && 'lg:grid-cols-2')}>
        {showJoin && (
          <div className="rounded-[var(--radius-lg)] bg-blue p-8 text-on-blue shadow-[0_6px_0_0_var(--blue-strong)]">
            {e.text('join.title', { as: 'h2', label: 'Titre : adhésion', className: 'text-3xl' })}
            {e.text('join.text', { as: 'p', label: 'Texte : adhésion', multiline: true, className: 'mt-3 text-lg opacity-90' })}
            <div className="mt-6">{e.link('join.cta', { className: buttonClasses('highlight', 'lg'), iconRight: <ArrowRight className="size-5" aria-hidden="true" /> })}</div>
          </div>
        )}
        <div className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-8">
          {e.text('contact.title', { as: 'h2', label: 'Titre : contact', className: 'text-3xl text-ink' })}
          <dl className="mt-5 space-y-4">
            <div className="flex gap-3">
              <dt>
                <Mail className="mt-1 size-5 text-blue" aria-hidden="true" />
                <span className="sr-only">E-mail</span>
              </dt>
              <dd>
                <a href={`mailto:${site.contactEmail}`} className="link-ink font-semibold break-all">
                  {site.contactEmail}
                </a>
              </dd>
            </div>
            <div className="flex gap-3">
              <dt>
                <MapPin className="mt-1 size-5 text-blue" aria-hidden="true" />
                <span className="sr-only">Adresse</span>
              </dt>
              <dd className="whitespace-pre-line text-ink-soft">{site.address}</dd>
            </div>
          </dl>
          <ul className="mt-6 flex flex-wrap gap-2">
            {site.socials.map((social) => (
              <li key={social.id}>
                <a href={social.url} target="_blank" rel="noopener noreferrer" className={buttonClasses('secondary', 'sm')}>
                  {social.label} <ArrowUpRight className="size-4" aria-hidden="true" />
                  <span className="sr-only">(nouvel onglet)</span>
                </a>
              </li>
            ))}
          </ul>
          {page.editMode && <p className="mt-4 text-xs text-ink-muted">Coordonnées et réseaux : Administration › Réglages du site.</p>}
        </div>
      </section>
    </EditableArea>
  )
}
