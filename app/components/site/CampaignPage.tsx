import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Check, Mail } from 'lucide-react'
import { loadPageContent } from '@/lib/content/page'
import { getPublishedContent } from '@/lib/data/content'
import { createEditor } from '@/app/components/edit/editor'
import { EditableArea } from '@/app/components/edit/EditableArea'
import { buttonClasses } from '@/app/components/ui/Button'

/**
 * Pages de campagne (e-mail aux anciens, QR code des salons) : une seule
 * promesse, un seul bouton. Publiques, contrairement à l'ancien site où le
 * proxy les renvoyait vers la connexion.
 */
export async function CampaignPage({ contentKey }: { contentKey: 'alumni' | 'qrcode' }) {
  const [page, site] = await Promise.all([loadPageContent(contentKey), getPublishedContent('site')])
  const e = createEditor(`content:${contentKey}`, page.data, page.editMode, { signedIn: page.signedIn })

  return (
    <EditableArea docs={[page.doc]}>
      <section className="bg-wash">
        <div className="container-page py-14 text-center sm:py-20">
          {e.text('title', { as: 'h1', label: 'Titre', className: 'animate-rise font-display-tight text-[clamp(2.5rem,7vw,4.5rem)] leading-none text-on-wash' })}
          {e.text('tagline', { as: 'p', label: 'Accroche', className: 'animate-rise-1 mx-auto mt-4 max-w-2xl font-hand text-[clamp(1.6rem,4vw,2.25rem)] leading-tight text-highlight' })}
          <ul className="animate-rise-2 mt-8 flex flex-wrap justify-center gap-2">
            {site.socials.map((social) => (
              <li key={social.id}>
                <a href={social.url} target="_blank" rel="noopener noreferrer" className={buttonClasses('on-wash', 'sm')}>
                  {social.label} <ArrowUpRight className="size-4" aria-hidden="true" />
                  <span className="sr-only">(nouvel onglet)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page -mt-6 pb-16">
        {e.list<{ id: string; icon: string; title: string; text: string }>(
          'benefits',
          (_item, index, path) => (
            <div className="h-full rounded-[var(--radius-lg)] border border-line bg-paper-raised p-6 text-center shadow-[var(--shadow-md)]">
              <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-blue-soft text-blue">{e.icon(`${path}.icon`, { className: 'size-6' })}</span>
              {e.text(`${path}.title`, { as: 'h2', label: `Avantage ${index + 1} : titre`, className: 'text-xl text-ink' })}
              {e.text(`${path}.text`, { as: 'p', label: `Avantage ${index + 1} : texte`, multiline: true, className: 'mt-2 text-ink-soft' })}
            </div>
          ),
          { newItem: { icon: 'sparkles', title: 'Nouvel avantage', text: 'Décrivez cet avantage.' }, itemLabel: 'Avantage', className: 'grid gap-5 md:grid-cols-3', max: 6 }
        )}

        <div className="mx-auto mt-12 max-w-2xl rounded-[var(--radius-lg)] border border-line bg-paper-raised p-8 text-center sm:p-10">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-highlight px-3 py-1 text-sm font-bold text-on-highlight">
            <Check className="size-4" aria-hidden="true" />
            {e.text('badge', { label: 'Pastille' })}
          </p>
          {e.text('ctaTitle', { as: 'h2', label: 'Titre de l’appel', className: 'mt-4 text-[clamp(1.75rem,4vw,2.5rem)] text-ink' })}
          {e.text('ctaText', { as: 'p', label: 'Texte de l’appel', multiline: true, className: 'mt-3 text-lg text-ink-soft' })}
          {e.text('ctaNote', { as: 'p', label: 'Mention', className: 'mt-2 text-sm font-semibold text-ink-muted' })}
          {page.signedIn && !page.editMode ? (
            // Déjà membre : pas d'appel à créer un compte
            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="font-semibold text-ink">Vous êtes déjà membre du réseau.</p>
              <Link href="/accueil" className={buttonClasses('primary', 'lg')}>
                Mon espace membre <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <>
              {e.text('ctaPrompt', { as: 'p', label: 'Invitation', className: 'mt-6 font-semibold text-ink' })}
              <div className="mt-4 flex flex-col items-center gap-3">
                {e.link('cta', { className: buttonClasses('primary', 'lg'), iconRight: <ArrowRight className="size-5" aria-hidden="true" /> })}
                <p className="text-sm text-ink-soft">
                  Déjà un compte ?{' '}
                  <Link href="/connexion" className="link-ink font-semibold">
                    Se connecter
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        <p className="mt-10 flex items-center justify-center gap-2 text-sm text-ink-soft">
          <Mail className="size-4 text-blue" aria-hidden="true" />
          Une question ?{' '}
          <a href={`mailto:${site.contactEmail}`} className="link-ink font-semibold">
            {site.contactEmail}
          </a>
        </p>
      </section>
    </EditableArea>
  )
}
