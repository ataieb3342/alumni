import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { client } from '@/sanity/lib/client'
import { userAnnouncementsQuery } from '@/sanity/lib/queries'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import Link from 'next/link'
import MyAnnouncementCard from '@/app/components/MyAnnouncementCard'

export const metadata = {
  title: 'Mes annonces - Association VH Besançon',
  description: 'Gérez vos annonces publiées',
}

interface Announcement {
  _id: string
  title: string
  slug: {
    current: string
  }
  type: string
  company?: string
  location?: string
  status: string
  publishedAt: string
  expiresAt?: string
}

export default async function MyAnnouncementsPage() {
  // Vérifier l'authentification
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/connexion?callbackUrl=/annonces/mes-annonces')
  }

  // Récupérer les annonces de l'utilisateur
  const announcements: Announcement[] = await client.fetch(userAnnouncementsQuery, {
    userId: session.user.id
  })

  const publishedAnnouncements = announcements.filter(a => a.status === 'published')
  const draftAnnouncements = announcements.filter(a => a.status === 'draft')

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes annonces</h1>
              <p className="text-gray-600">Gérez vos annonces publiées</p>
            </div>
            <Link
              href="/annonces/nouvelle"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle annonce
            </Link>
          </div>

          {announcements.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-900 font-medium text-lg mb-2">Aucune annonce</p>
              <p className="text-gray-600 mb-6">Commencez par créer votre première annonce</p>
              <Link
                href="/annonces/nouvelle"
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Créer une annonce
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Annonces publiées */}
              {publishedAnnouncements.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Publiées ({publishedAnnouncements.length})
                  </h2>
                  <div className="space-y-4">
                    {publishedAnnouncements.map((announcement) => (
                      <MyAnnouncementCard key={announcement._id} announcement={announcement} />
                    ))}
                  </div>
                </div>
              )}

              {/* Brouillons */}
              {draftAnnouncements.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Brouillons ({draftAnnouncements.length})
                  </h2>
                  <div className="space-y-4">
                    {draftAnnouncements.map((announcement) => (
                      <MyAnnouncementCard key={announcement._id} announcement={announcement} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  )
}
