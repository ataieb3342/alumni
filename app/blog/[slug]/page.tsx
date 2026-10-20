import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Clock, Lock } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getEditorContext } from '@/lib/auth/session'
import { editableContent, getPostBySlug, publishedContent } from '@/lib/data/posts'
import { readingTimeMinutes } from '@/lib/richtext'
import { createEditor } from '@/app/components/edit/editor'
import { EditableArea } from '@/app/components/edit/EditableArea'
import { Alert } from '@/app/components/ui/Alert'
import { Badge } from '@/app/components/ui/Badge'
import { Picture } from '@/app/components/ui/Picture'
import { PostSettings } from '@/app/components/blog/PostSettings'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPostBySlug((await params).slug)
  if (!post || post.status !== 'published') return { title: 'Article' }
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: { type: 'article', title: post.title, description: post.excerpt ?? undefined, ...(post.mainImage ? { images: [post.mainImage.url] } : {}) },
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()
  const [session, editor] = await Promise.all([auth(), getEditorContext()])
  const isMember = session?.user?.accountStatus === 'active' && !session.user.id?.startsWith('temp-')

  // Les visiteurs ne voient que la version publiée ; un brouillon n'existe que pour les administrateurs
  if (post.status !== 'published' && !editor.isAdmin) notFound()
  if (post.visibility === 'members' && !isMember) redirect(`/connexion?callbackUrl=/blog/${slug}`)

  const content = editor.editMode ? editableContent(post) : publishedContent(post)
  const docKey = `post:${post.id}`
  const e = createEditor(docKey, content, editor.editMode)
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://vh-besancon-alumni.fr'
  const url = encodeURIComponent(`${base}/blog/${post.slug}`)
  const shareTitle = encodeURIComponent(post.title)

  return (
    <EditableArea
      docs={[
        editor.editMode
          ? {
              key: docKey,
              label: `Article « ${content.title} »`,
              endpoint: `/api/admin/posts/${post.id}`,
              data: content,
              hasDraft: !!post.draft,
              status: post.status,
              revision: post.updatedAt.toISOString(),
              canDelete: true,
              publicUrl: `/blog/${post.slug}`,
            }
          : null,
      ]}
    >
      <article className="pb-16">
        <header className="bg-seyes border-b border-line">
          <div className="container-page py-10 sm:py-14">
            <div className="mx-auto max-w-3xl">
              <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-blue">
                <ArrowLeft className="size-4" aria-hidden="true" /> Tous les articles
              </Link>
              {post.status !== 'published' && (
                <Alert tone="warning" className="mt-4" title="Brouillon">
                  Cet article n’est pas publié : seuls les administrateurs le voient. Publiez-le depuis la barre d’administration.
                </Alert>
              )}
              {post.status === 'published' && editor.isAdmin && post.draft && !editor.editMode && (
                <Alert tone="info" className="mt-4">
                  Des modifications non publiées existent : passez en mode édition pour les voir.
                </Alert>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
                <time dateTime={content.publishedAt}>{new Date(content.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-4" aria-hidden="true" /> {readingTimeMinutes(content.bodyHtml)} min de lecture
                </span>
                {content.visibility === 'members' && (
                  <Badge tone="outline" icon={<Lock className="size-3" aria-hidden="true" />}>
                    Réservé aux membres
                  </Badge>
                )}
              </div>
              {e.text('title', { as: 'h1', label: 'Titre de l’article', className: 'mt-3 block font-display-tight text-[clamp(2.1rem,5.5vw,3.6rem)] leading-[1.03] text-ink' })}
              {(content.excerpt || editor.editMode) &&
                e.text('excerpt', {
                  as: 'p',
                  label: 'Chapô',
                  multiline: true,
                  placeholder: 'Chapô : deux phrases qui donnent envie de lire',
                  className: 'mt-5 block border-l-4 border-red pl-5 font-display text-xl text-ink-soft italic sm:text-2xl',
                })}
            </div>
          </div>
        </header>

        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            {editor.editMode && (
              <div className="mt-8">
                <PostSettings docKey={docKey} initial={{ slug: content.slug, visibility: content.visibility, publishedAt: content.publishedAt }} />
              </div>
            )}
            {e.image(
              'mainImage',
              (image) =>
                image ? (
                  <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">
                    <Picture image={image} sizes="(min-width: 768px) 768px, 100vw" priority />
                  </div>
                ) : editor.editMode ? (
                  <div className="aspect-[16/9] rounded-[var(--radius-lg)] border-2 border-dashed border-line-strong/50 bg-paper-sunken" />
                ) : null,
              { className: 'mt-8', label: 'Image principale', allowRemove: true }
            )}
            <div className="mt-10">{e.rich('bodyHtml', { label: 'Corps de l’article', className: 'text-[1.1rem]' })}</div>

            <footer className="mt-14 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/blog" className="link-ink font-semibold">
                Voir tous les articles
              </Link>
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                Partager :
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1.5 font-semibold text-ink-soft hover:border-ink">
                  LinkedIn
                </a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${url}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1.5 font-semibold text-ink-soft hover:border-ink">
                  Facebook
                </a>
                <a href={`https://twitter.com/intent/tweet?url=${url}&text=${shareTitle}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1.5 font-semibold text-ink-soft hover:border-ink">
                  X
                </a>
              </div>
            </footer>
          </div>
        </div>
      </article>
    </EditableArea>
  )
}
