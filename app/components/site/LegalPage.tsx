import { loadPageContent } from '@/lib/content/page'
import { getEditableContent } from '@/lib/data/content'
import { createEditor } from '@/app/components/edit/editor'
import { EditableArea } from '@/app/components/edit/EditableArea'
import { PageHero } from '@/app/components/site/PageHero'

/** Mentions légales et politique de confidentialité : texte riche éditable, date réelle de mise à jour */
export async function LegalPage({ contentKey }: { contentKey: 'legal' | 'privacy' }) {
  const page = await loadPageContent(contentKey)
  const { publishedAt } = await getEditableContent(contentKey)
  const e = createEditor(`content:${contentKey}`, page.data, page.editMode)
  return (
    <EditableArea docs={[page.doc]}>
      <PageHero size="sm" title={e.text('title', { label: 'Titre' })} lead={e.text('lead', { as: 'p', label: 'Chapeau', multiline: true })} />
      <article className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {e.rich('bodyHtml', { label: 'Contenu' })}
          {publishedAt && (
            <p className="mt-12 border-t border-line pt-4 text-sm text-ink-muted">
              Dernière mise à jour : {publishedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </article>
    </EditableArea>
  )
}
