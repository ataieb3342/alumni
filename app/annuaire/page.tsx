import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { directoryUsersQuery } from '@/sanity/lib/queries'
import Header from '../components/Header'
import Footer from '../components/Footer'
import DirectoryList from '../components/DirectoryList'
import HeroSection from '../components/HeroSection'
import type { DirectoryUser } from '../components/DirectoryCard'

export default async function AnnuairePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/connexion')
  }

  // Les lycéens ne sont pas remontés par la requête (profil restreint)
  const [members, params] = await Promise.all([
    client.fetch<DirectoryUser[]>(directoryUsersQuery),
    searchParams,
  ])
  const currentUserId = members.find((member) => member.email === session.user?.email)?._id

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Hero Section avec image en background */}
        <HeroSection
          compact
          title="Annuaire"
          subtitle={`${members.length} anciens élèves, prépas et personnels du lycée Victor Hugo : trouvez un parcours qui vous inspire`}
        />

        {/* Directory Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-0 pb-16 -mt-12 relative z-10">
          <DirectoryList members={members} currentUserId={currentUserId} initialParams={params} />
        </section>
      </main>

      <Footer />
    </>
  )
}
