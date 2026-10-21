import type { Metadata } from 'next'
import { Mail } from 'lucide-react'
import { auth } from '@/lib/auth'
import { loadPageContent } from '@/lib/content/page'
import { listPublishedPosts, listUnpublishedPosts } from '@/lib/data/posts'
import { createEditor } from '@/app/components/edit/editor'
import { EditableArea } from '@/app/components/edit/EditableArea'
import { buttonClasses } from '@/app/components/ui/Button'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { PageHero } from '@/app/components/site/PageHero'
import { BlogBrowser, type BlogPostItem } from '@/app/components/blog/BlogBrowser'
import { NewPostButton } from '@/app/components/edit/lazy'

export const metadata: Metadata = { title: 'Blog', description: "Actualités de l'association VH Besançon Alumni, événements et portraits" }

export default async function BlogPage() {
  const session = await auth()
  const isMember = session?.user?.accountStatus === 'active' && !session.user.id?.startsWith('temp-')
  const page = await loadPageContent('blog')
  const [published, unpublished] = await Promise.all([
    // Les articles réservés aux membres ne sont listés qu'aux membres connectés
    listPublishedPosts({ includeMembersOnly: isMember }),
    page.editMode ? listUnpublishedPosts() : Promise.resolve([]),
  ])
  const posts: BlogPostItem[] = [
    ...unpublished.filter((post) => post.status !== 'published').map((post) => ({ ...post, hasDraft: true })),
    ...published.map((post) => ({ ...post, hasDraft: unpublished.some((u) => u.id === post.id) })),
  ]
  const e = createEditor('content:blog', page.data, page.editMode)

  return (
    <EditableArea docs={[page.doc]}>
      <PageHero
        size="sm"
        eyebrow="Le journal de l’association"
        title={e.text('title', { label: 'Titre' })}
        lead={e.text('lead', { as: 'p', label: 'Chapeau', multiline: true })}
        actions={page.editMode ? <NewPostButton /> : undefined}
      />
      <div className="container-page py-10 sm:py-14">
        {posts.length === 0 ? (
          <EmptyState title="Aucun article pour le moment">Les prochaines actualités de l’association apparaîtront ici.</EmptyState>
        ) : (
          <BlogBrowser posts={posts} />
        )}

        <section className="bg-wash mt-16 grid gap-6 rounded-[var(--radius-lg)] p-8 sm:grid-cols-[1fr_auto] sm:items-center sm:p-10">
          <div>
            {e.text('newsletterTitle', { as: 'h2', label: 'Titre de l’appel newsletter', className: 'text-3xl text-on-wash' })}
            {e.text('newsletterText', { as: 'p', label: 'Texte de l’appel newsletter', multiline: true, className: 'mt-2 max-w-xl text-on-wash-soft' })}
          </div>
          {e.link('newsletterCta', { className: buttonClasses('highlight', 'lg'), icon: <Mail className="size-5" aria-hidden="true" /> })}
        </section>
      </div>
    </EditableArea>
  )
}
