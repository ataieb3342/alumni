import type { Metadata } from 'next'
import { requireAdminPage } from '@/lib/auth/session'
import { countUsersByStatus } from '@/lib/data/users'
import { AdminNav } from '@/app/components/admin/AdminNav'

export const metadata: Metadata = { title: { default: 'Administration', template: '%s · Administration' }, robots: { index: false } }

/** Toutes les pages /admin vérifient le rôle en base (et chaque action d'API aussi) */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage()
  const counts = await countUsersByStatus()
  return (
    <div className="bg-paper-sunken">
      <div className="container-page grid grid-cols-1 gap-6 py-6 lg:grid-cols-[14rem_1fr] lg:gap-10 lg:py-10">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 hidden font-display text-xl text-ink lg:block">Administration</p>
          <AdminNav pending={counts.pending ?? 0} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
