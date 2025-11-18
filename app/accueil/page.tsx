import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { client } from '@/sanity/lib/client'
import { recentPostsQuery, recentAnnouncementsQuery, popularTestimonialsQuery } from '@/sanity/lib/queries'
import AccueilHeroSection from '@/app/components/AccueilHeroSection'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import TestimonialCard from '@/app/components/TestimonialCard'
import AnnouncementCard from '@/app/components/AnnouncementCard'
import Link from 'next/link'
import Image from 'next/image'
import { Briefcase, MessageSquareQuote } from 'lucide-react'

export const revalidate = 60 // Revalider la page toutes les 60 secondes

// Images de fallback disponibles
const FALLBACK_IMAGES = [
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
  description: unknown[]
  contactEmail?: string
  externalLink?: string
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

interface Testimonial {
  _id: string
  title: string
  slug: {
    current: string
  }
  type: string
  excerpt: string
  rating?: number
  likes?: number
  tags?: string[]
  publishedAt: string
  featuredImage?: {
    asset: {
      _id: string
      url: string
    }
  }
  author: {
    _id: string
    firstName: string
    lastName: string
    userType: string
    promotionYear?: string
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

  // Récupérer les 6 derniers articles, annonces et témoignages
  const [recentPosts, recentAnnouncements, popularTestimonials] = await Promise.all([
    client.fetch<Post[]>(recentPostsQuery),
    client.fetch<Announcement[]>(recentAnnouncementsQuery),
    client.fetch<Testimonial[]>(popularTestimonialsQuery)
  ])

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Hero Section avec effet de scroll */}
        <AccueilHeroSection
          userName={session.user?.name || null}
        />

        {/* Actions rapides - Version compacte et moderne */}
        <section className="max-w-7xl mx-auto px-6 -mt-12 relative z-20 mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/annonces/nouvelle"
                className="group flex flex-col items-center justify-center p-4 rounded-xl hover:bg-blue-50 transition-all duration-300"
              >
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl w-14 h-14 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-center">
                  Poster une annonce
                </span>
              </Link>

              <Link
                href="/temoignages/nouveau"
                className="group flex flex-col items-center justify-center p-4 rounded-xl hover:bg-purple-50 transition-all duration-300"
              >
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl w-14 h-14 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <MessageSquareQuote className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors text-center">
                  Créer un témoignage
                </span>
              </Link>

              <Link
                href="/annuaire"
                className="group flex flex-col items-center justify-center p-4 rounded-xl hover:bg-indigo-50 transition-all duration-300"
              >
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl w-14 h-14 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors text-center">
                  Consulter l&apos;annuaire
                </span>
              </Link>

              <Link
                href="/profil"
                className="group flex flex-col items-center justify-center p-4 rounded-xl hover:bg-green-50 transition-all duration-300"
              >
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl w-14 h-14 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors text-center">
                  Modifier mon profil
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Section Articles - Layout featured */}
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-2">À la une</h2>
              <p className="text-gray-600">Les derniers articles de la communauté</p>
            </div>
            {recentPosts.length > 0 && (
              <Link
                href="/blog"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 font-semibold shadow-lg"
              >
                Voir tout
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>

          {recentPosts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:grid-rows-[1fr]">
              {/* Article featured - Le premier en grand */}
              {recentPosts[0] && (() => {
                const post = recentPosts[0]
                const imageUrl = post.mainImage?.asset?.url
                  ? `${post.mainImage.asset.url}?w=800&h=600&fit=crop`
                  : getRandomFallbackImage(post._id)

                return (
                  <Link
                    href={`/blog/${post.slug.current}`}
                    className="group bg-white rounded-3xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 h-full"
                  >
                    <div className="relative h-full min-h-[400px] overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={post.mainImage?.alt || post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium mb-3">
                          À la une
                        </div>
                        <h3 className="text-3xl font-bold mb-3 line-clamp-2">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-blue-100 line-clamp-2 mb-3">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-blue-200">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long'
                          })}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })()}

              {/* Autres articles */}
              <div className="flex flex-col gap-6">
                {recentPosts.slice(1, 3).map((post) => {
                  const imageUrl = post.mainImage?.asset?.url
                    ? `${post.mainImage.asset.url}?w=400&h=300&fit=crop`
                    : getRandomFallbackImage(post._id)

                  return (
                    <Link
                      key={post._id}
                      href={`/blog/${post.slug.current}`}
                      className="group flex gap-4 bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 flex-1"
                    >
                      <div className="relative w-40 flex-shrink-0">
                        <Image
                          src={imageUrl}
                          alt={post.mainImage?.alt || post.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 py-6 pr-4 flex flex-col justify-center">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long'
                          })}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
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

        {/* Section Témoignages - Avec beau background */}
        <section className="relative overflow-hidden py-16">
          {/* Background animé */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-4xl font-black text-white mb-2">Témoignages</h2>
                <p className="text-purple-200">Découvrez les expériences de nos membres</p>
              </div>
              {popularTestimonials.length > 0 && (
                <Link
                  href="/temoignages"
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 font-semibold shadow-lg"
                >
                  Voir tout
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>

            {popularTestimonials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularTestimonials.slice(0, 6).map((testimonial) => (
                  <TestimonialCard key={testimonial._id} testimonial={testimonial} />
                ))}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-16 text-center">
                <svg className="w-16 h-16 text-white/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-white/70 text-lg">Aucun témoignage pour le moment</p>
              </div>
            )}
          </div>
        </section>

        {/* Section Opportunités */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-black text-gray-900 mb-2">Opportunités</h2>
              <p className="text-gray-600">Les dernières annonces de la communauté</p>
            </div>
            {recentAnnouncements.length > 0 && (
              <Link
                href="/annonces"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 font-semibold shadow-lg"
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
              {recentAnnouncements.slice(0, 6).map((announcement) => (
                <AnnouncementCard key={announcement._id} announcement={announcement} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-16 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-lg">Aucune annonce pour le moment</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
