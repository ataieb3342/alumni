'use client'

import { useState, useMemo, useEffect } from 'react'
import BlogFilters from './BlogFilters'
import Pagination from './Pagination'
import Link from 'next/link'
import Image from 'next/image'
import { getImageProps } from '@/sanity/lib/image'

interface Post {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt?: string
  mainImage?: {
    asset: {
      _id: string
      url: string
    }
    alt?: string
  }
}

interface BlogContentProps {
  posts: Post[]
}

const POSTS_PER_PAGE = 9

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

export default function BlogContent({ posts }: BlogContentProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [sortOrder, setSortOrder] = useState('date-desc')

  // Calculer les posts filtrés et triés avec useMemo pour éviter les recalculs
  const filteredPosts = useMemo(() => {
    let filtered = [...posts]

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt?.toLowerCase().includes(query)
      )
    }

    // Filtre par année
    if (selectedYear) {
      filtered = filtered.filter((post) => {
        const year = new Date(post.publishedAt).getFullYear().toString()
        return year === selectedYear
      })
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'date-desc':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        case 'date-asc':
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
        case 'title-asc':
          return a.title.localeCompare(b.title)
        case 'title-desc':
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })

    return filtered
  }, [posts, searchQuery, selectedYear, sortOrder])

  // Reset à la première page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedYear, sortOrder])

  // Calculer les articles à afficher pour la page courante
  const indexOfLastPost = currentPage * POSTS_PER_PAGE
  const indexOfFirstPost = indexOfLastPost - POSTS_PER_PAGE
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost)
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)

  // Obtenir les années disponibles
  const availableYears = useMemo(() => {
    return Array.from(
      new Set(posts.map((post) => new Date(post.publishedAt).getFullYear()))
    ).sort((a, b) => b - a)
  }, [posts])

  return (
    <>
      {/* Filtres */}
      <BlogFilters
        onSearch={setSearchQuery}
        onYearFilter={setSelectedYear}
        onSort={setSortOrder}
        availableYears={availableYears}
      />

      {/* Résultats */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-white/20">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun article trouvé</h3>
            <p className="text-gray-600">
              Essayez de modifier vos critères de recherche ou de réinitialiser les filtres.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Grid des articles */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentPosts.map((post) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug.current}`}
                className="group"
              >
                <article className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 h-full flex flex-col border border-white/20 hover:border-white/40 transform hover:-translate-y-1">
                  {/* Image avec effet de superposition */}
                  {post.mainImage ? (
                    <div className="relative h-56 w-full overflow-hidden">
                      <Image
                        {...getImageProps(post.mainImage, 800, 400)}
                        alt={post.mainImage.alt || post.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      {/* Badge de date */}
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                        {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-56 w-full overflow-hidden">
                      <Image
                        src={getRandomFallbackImage(post._id)}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      {/* Badge de date */}
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                        {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  )}

                  {/* Contenu */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-blue-700 transition-colors duration-300 line-clamp-2 leading-tight">
                        {post.title}
                      </h2>

                      {post.excerpt && (
                        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}
                    </div>

                    {/* Lien de lecture */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-blue-700 font-semibold group-hover:text-blue-800 transition-colors flex items-center gap-2">
                        Lire l&apos;article
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Call to Action */}
      <div className="text-center mt-16">
        <div className="bg-blue-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Ne manquez aucun article</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Abonnez-vous à notre newsletter pour recevoir nos derniers articles directement dans votre boîte mail.
          </p>
          <Link
            href="/parametres#newsletter"
            className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            S&apos;abonner à la newsletter
          </Link>
        </div>
      </div>
    </>
  )
}
