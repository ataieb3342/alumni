import type { Metadata } from 'next'
import { requireMemberPage } from '@/lib/auth/session'
import { loadPageContent } from '@/lib/content/page'
import { withCount } from '@/lib/content/merge'
import { listDirectoryMembers } from '@/lib/data/users'
import { toCardUser } from '@/app/components/directory/toCardUser'
import { createEditor } from '@/app/components/edit/editor'
import { EditableArea } from '@/app/components/edit/EditableArea'
import { PageHero } from '@/app/components/site/PageHero'
import DirectoryList from '@/app/components/directory/DirectoryList'

export const metadata: Metadata = { title: 'Annuaire' }

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireMemberPage('/annuaire')
  const [members, params, page] = await Promise.all([listDirectoryMembers(), searchParams, loadPageContent('directory')])
  const e = createEditor('content:directory', page.data, page.editMode)

  return (
    <EditableArea docs={[page.doc]}>
      <PageHero
        size="sm"
        eyebrow="Le cœur du réseau"
        title={e.text('title', { label: 'Titre' })}
        lead={e.text('lead', { as: 'p', label: 'Chapeau ({count} = nombre de membres)', multiline: true, display: (value) => withCount(value, members.length) })}
      />
      <div className="container-page relative pb-16 sm:-mt-6">
        <DirectoryList members={members.map(toCardUser)} currentUserId={user.id} initialParams={params} />
      </div>
    </EditableArea>
  )
}
