import type { Metadata } from 'next'
import { requireMemberPage } from '@/lib/auth/session'
import { PageHero } from '@/app/components/site/PageHero'
import { AnnouncementForm } from '@/app/components/announcements/AnnouncementForm'

export const metadata: Metadata = { title: 'Publier une annonce' }

export default async function NewAnnouncementPage() {
  await requireMemberPage('/annonces/nouvelle')
  return (
    <>
      <PageHero size="sm" eyebrow="Annonces" title="Publier une annonce" lead="Un stage, un emploi, un événement, du matériel à vendre : partagez-le avec la communauté." />
      <div className="container-page py-10">
        <div className="mx-auto max-w-3xl">
          <AnnouncementForm />
        </div>
      </div>
    </>
  )
}
