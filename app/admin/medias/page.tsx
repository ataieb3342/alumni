import Link from 'next/link'
import { requireAdminPage } from '@/lib/auth/session'
import { listMedia } from '@/lib/data/media'
import { cn } from '@/lib/utils'
import { AdminCard, AdminHeader } from '@/app/components/admin/AdminCard'
import { MediaLibrary } from '@/app/components/admin/MediaLibrary'

export const metadata = { title: 'Médiathèque' }

export default async function AdminMediaPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdminPage()
  const page = Math.max(1, Number((await searchParams).page ?? 1) || 1)
  const result = await listMedia({ page })
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize))
  return (
    <div className="space-y-6">
      <AdminHeader title="Médiathèque" lead={`${result.total} images : photos de profil, illustrations des pages et des articles.`} />
      <AdminCard>
        <MediaLibrary
          items={result.rows.map((row) => ({
            id: row.id,
            url: row.url,
            filename: row.filename,
            alt: row.alt,
            width: row.width,
            height: row.height,
            size: row.size,
            createdAt: row.createdAt.toISOString(),
            uploader: row.uploader?.firstName ? `${row.uploader.firstName} ${row.uploader.lastName}` : null,
          }))}
        />
        {pages > 1 && (
          <nav aria-label="Pages" className="mt-6 flex flex-wrap justify-center gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link key={n} href={`/admin/medias?page=${n}`} aria-current={n === page ? 'page' : undefined} className={cn('inline-flex size-9 items-center justify-center rounded-full text-sm font-semibold', n === page ? 'bg-blue text-on-blue' : 'border border-line text-ink-soft')}>
                {n}
              </Link>
            ))}
          </nav>
        )}
      </AdminCard>
    </div>
  )
}
