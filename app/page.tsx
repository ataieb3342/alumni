import { redirect } from 'next/navigation'
import { ArrowRight, Check } from 'lucide-react'
import { auth } from '@/lib/auth'
import { loadPageContent } from '@/lib/content/page'
import { getNetworkFigures } from '@/lib/data/network'
import { createEditor } from '@/app/components/edit/editor'
import { EditableArea } from '@/app/components/edit/EditableArea'
import { buttonClasses } from '@/app/components/ui/Button'
import { Picture } from '@/app/components/ui/Picture'
import { SectionHeading } from '@/app/components/site/PageHero'

export default async function Home() {
  const session = await auth()
  const page = await loadPageContent('home')
  // Les membres ont leur propre accueil ; un administrateur en mode édition peut modifier celui-ci
  if (session?.user?.accountStatus === 'active' && !session.user.id?.startsWith('temp-') && !page.editMode) {
    redirect('/accueil')
  }
  const figures = await getNetworkFigures()
  const e = createEditor('content:home', page.data, page.editMode)

  return (
    <EditableArea docs={[page.doc]}>
      {/* Héros : lavis d'encre, la photo du lycée en tirage scotché */}
      <section className="bg-wash relative overflow-hidden">
        <div className="container-page grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div>
            <p className="animate-rise inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-on-wash ring-1 ring-white/15">
              <span className="size-2 rounded-full bg-red" aria-hidden="true" />
              {e.text('hero.eyebrow', { label: 'Accroche' })}
            </p>
            <h1 className="animate-rise-1 font-display-tight mt-5 text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.95] text-on-wash">
              {e.text('hero.title', { label: 'Titre' })}{' '}
              <em className="text-highlight not-italic sm:italic">{e.text('hero.accent', { label: 'Titre (mot mis en valeur)' })}</em>
            </h1>
            {e.text('hero.lead', { as: 'p', label: 'Chapeau', multiline: true, className: 'animate-rise-2 mt-6 max-w-xl text-lg text-on-wash-soft sm:text-xl' })}
            <div className="animate-rise-3 mt-8 flex flex-wrap items-center gap-3">
              {e.link('hero.primary', { className: buttonClasses('highlight', 'lg'), iconRight: <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /> })}
              {e.link('hero.secondary', { className: buttonClasses('on-wash', 'lg') })}
            </div>
            <p className="animate-rise-3 mt-4 flex items-center gap-2 text-sm text-on-wash-soft">
              <Check className="size-4 text-highlight" aria-hidden="true" />
              {e.text('hero.note', { label: 'Mention sous les boutons' })}
            </p>
          </div>

          {e.image(
            'hero.image',
            (image) =>
              image ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-[6px] border-[10px] border-b-[36px] border-paper-raised shadow-[var(--shadow-lg)]">
                  <Picture image={image} sizes="(min-width: 1024px) 40vw, 90vw" priority />
                </div>
              ) : (
                <div className="aspect-[4/3] rounded-[var(--radius-lg)] border-2 border-dashed border-white/25" />
              ),
            { className: 'animate-rise-2 relative mx-auto w-full max-w-md rotate-2 lg:max-w-none', label: 'Photo du héros' }
          )}
        </div>

        {/* Le réseau en chiffres, calculés depuis l'annuaire */}
        <div className="border-t border-white/10">
          <dl className="container-page grid grid-cols-3 divide-x divide-white/10 py-6 text-center sm:py-8">
            {[
              { value: figures.members, label: 'parcours dans l’annuaire' },
              { value: figures.cities, label: 'villes traversées' },
              { value: figures.organizations, label: 'écoles et entreprises' },
            ].map((figure) => (
              <div key={figure.label} className="px-2">
                <dt className="sr-only">{figure.label}</dt>
                <dd className="font-display-tight text-[clamp(1.75rem,5vw,3rem)] leading-none text-on-wash">{figure.value}</dd>
                <dd className="mt-1.5 text-xs text-on-wash-soft sm:text-sm" aria-hidden="true">
                  {figure.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Ce que l'espace membres apporte */}
      <section aria-labelledby="home-features" className="container-page py-16 sm:py-24">
        <SectionHeading
          id="home-features"
          title={e.text('features.title', { label: 'Titre de la section' })}
          lead={e.text('features.lead', { as: 'p', label: 'Introduction de la section', multiline: true })}
        />
        {e.list<{ id: string; icon: string; title: string; text: string; bullets: string }>(
          'features.items',
          (_item, index, path) => (
            <article className="group relative flex h-full flex-col rounded-[var(--radius-lg)] border border-line bg-paper-raised p-6 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
              <span className="absolute top-6 left-0 h-10 w-[3px] rounded-r bg-red" aria-hidden="true" />
              <span className="mb-5 grid size-12 place-items-center rounded-[var(--radius-md)] bg-blue-soft text-blue">
                {e.icon(`${path}.icon`, { className: 'size-6' })}
              </span>
              {e.text(`${path}.title`, { as: 'h3', label: `Titre de la carte ${index + 1}`, className: 'text-2xl text-ink' })}
              {e.text(`${path}.text`, { as: 'p', label: `Texte de la carte ${index + 1}`, multiline: true, className: 'mt-3 text-ink-soft' })}
              <BulletLines editor={e} path={`${path}.bullets`} index={index} />
            </article>
          ),
          {
            newItem: { icon: 'sparkles', title: 'Nouvelle carte', text: 'Décrivez ce service.', bullets: 'Premier point' },
            itemLabel: 'Carte',
            className: 'grid gap-5 md:grid-cols-3',
            max: 6,
          }
        )}
      </section>

      {/* Appel à l'adhésion */}
      <section aria-labelledby="home-join" className="container-page pb-20">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-blue px-6 py-12 text-center text-on-blue shadow-[0_6px_0_0_var(--blue-strong)] sm:px-12 sm:py-16">
          <div aria-hidden="true" className="absolute inset-0 opacity-25 [background-image:linear-gradient(to_bottom,rgb(255_255_255/0.35)_1px,transparent_1px)] [background-size:100%_32px]" />
          <div className="relative">
            <h2 id="home-join" className="text-[clamp(1.75rem,4vw,2.75rem)]">
              {e.text('join.title', { label: 'Titre de l’appel à adhérer' })}
            </h2>
            {e.text('join.text', { as: 'p', label: 'Texte de l’appel à adhérer', multiline: true, className: 'mx-auto mt-3 max-w-2xl text-lg opacity-90' })}
            <div className="mt-8 flex flex-col items-center gap-4">
              {e.link('join.cta', { className: buttonClasses('highlight', 'lg'), iconRight: <ArrowRight className="size-5" aria-hidden="true" /> })}
              <p className="text-sm opacity-90">
                {e.text('join.loginPrompt', { label: 'Phrase avant le lien de connexion' })}{' '}
                <a href="/connexion" className="font-semibold underline underline-offset-4">
                  Se connecter
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </EditableArea>
  )
}

/** Puces d'une carte : une ligne par puce (éditable comme un texte multiligne) */
function BulletLines({ editor, path, index }: { editor: ReturnType<typeof createEditor>; path: string; index: number }) {
  if (editor.enabled) {
    return (
      <div className="mt-5 border-t border-dashed border-line pt-4 text-sm text-ink-soft">
        <p className="mb-1 text-xs font-semibold text-ink-muted">Points forts (un par ligne)</p>
        {editor.text(path, { as: 'p', multiline: true, label: `Points forts de la carte ${index + 1}` })}
      </div>
    )
  }
  const lines = String(editor.get(path) ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return null
  return (
    <ul className="mt-5 space-y-2 border-t border-dashed border-line pt-4 text-sm text-ink-soft">
      {lines.map((line) => (
        <li key={line} className="flex items-start gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
          {line}
        </li>
      ))}
    </ul>
  )
}
