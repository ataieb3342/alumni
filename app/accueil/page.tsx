import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { client } from '@/sanity/lib/client'
import { recentPostsQuery, recentAnnouncementsQuery } from '@/sanity/lib/queries'
import AccueilHeroSection from '@/app/components/AccueilHeroSection'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { Briefcase } from 'lucide-react'

export const revalidate = 60 // Revalider la page toutes les 60 secondes

// Images de fallback disponibles
const FALLBACK_IMAGES = [
  '/images/logo.jpg',
  '/images/lvh-facade-640x360.jpg',
  '/images/lycee-victor-hugo.jpg'
]

// Fonction pour obtenir une image aléatoire
const getRandomFallbackImage = (postId: string) => {
  // Utilise l'ID du post comme seed pour avoir la même image à chaque rendu
  const hash = postId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  const index = Math.abs(hash) % FALLBACK_IMAGES.length
  return FALLBACK_IMAGES[index]
}

interface Post {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt?: string
  visibility: 'public' | 'alumni'
  mainImage?: {
    asset: {
      _id: string
      url: string
    }
    alt?: string
  }
}

interface Announcement {
  _id: string
  title: string
  slug: { current: string }
  type: string
  company?: string
  location?: string
  description: string | Array<{
    _key: string
    _type: string
    children: Array<{ text: string }>
    markDefs: unknown[]
    style: string
  }>
  publishedAt: string
  expiresAt?: string
  author: {
    _id: string
    firstName: string
    lastName: string
    userType: string
    profileImage?: {
      asset: {
        _id: string
        url: string
      }
    }
  }
}

export default async function AccueilPage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/connexion')
  }

  // Récupérer les 6 derniers articles et annonces
  const [recentPosts, recentAnnouncements] = await Promise.all([
    client.fetch<Post[]>(recentPostsQuery),
    client.fetch<Announcement[]>(recentAnnouncementsQuery)
  ])

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Hero Section avec effet de scroll */}
        <AccueilHeroSection
          userName={session.user?.name || null}
        />

        {/* Actions rapides - Design épuré */}
        <section className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/annonces/nouvelle"
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Publier une annonce
                  </h3>
                  <p className="text-sm text-gray-500">Offres d&apos;emploi, stages</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/annuaire"
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-indigo-200"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    Annuaire
                  </h3>
                  <p className="text-sm text-gray-500">Réseau alumni</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/profil"
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Mon profil
                  </h3>
                  <p className="text-sm text-gray-500">Paramètres du compte</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </section>

        {/* Section Articles */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Derniers articles</h2>
              <div className="flex items-center gap-2">
                <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                <p className="text-base text-gray-600 font-medium">Actualités et nouveautés</p>
              </div>
            </div>
            {recentPosts.length > 0 && (
              <Link
                href="/blog"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Voir tout
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

          {recentPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.slice(0, 6).map((post) => {
                const imageUrl = post.mainImage?.asset?.url
                  ? `${post.mainImage.asset.url}?w=600&h=400&fit=crop`
                  : getRandomFallbackImage(post._id)

                return (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug.current}`}
                    className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={post.mainImage?.alt || post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-16 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <p className="text-gray-500 text-lg">Aucun article pour le moment</p>
            </div>
          )}
        </section>

        {/* Section Annonces */}
        <section className="bg-gradient-to-br from-gray-50 to-blue-50/30 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Dernières annonces</h2>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                  <p className="text-base text-gray-600 font-medium">Opportunités professionnelles</p>
                </div>
              </div>
              {recentAnnouncements.length > 0 && (
                <Link
                  href="/annonces"
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Voir tout
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>

            {recentAnnouncements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentAnnouncements.slice(0, 6).map((announcement) => {
                  const typeColors: { [key: string]: string } = {
                    job: 'bg-blue-100 text-blue-700',
                    internship: 'bg-green-100 text-green-700',
                    event: 'bg-purple-100 text-purple-700',
                    collaboration: 'bg-orange-100 text-orange-700',
                    other: 'bg-gray-100 text-gray-700'
                  }

                  const typeLabels: { [key: string]: string } = {
                    job: 'Emploi',
                    internship: 'Stage',
                    event: 'Événement',
                    collaboration: 'Collaboration',
                    other: 'Autre'
                  }

                  const description = typeof announcement.description === 'string'
                    ? announcement.description
                    : announcement.description?.[0]?.children?.[0]?.text || ''

                  return (
                    <Link
                      key={announcement._id}
                      href={`/annonces/${announcement.slug.current}`}
                      className="group bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${typeColors[announcement.type] || typeColors.other}`}>
                          {typeLabels[announcement.type] || 'Autre'}
                        </span>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {announcement.title}
                      </h3>

                      {announcement.company && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="font-medium">{announcement.company}</span>
                        </div>
                      )}

                      {announcement.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {announcement.location}
                        </div>
                      )}

                      {description && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {description}
                        </p>
                      )}
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-16 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 text-lg">Aucune annonce pour le moment</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
