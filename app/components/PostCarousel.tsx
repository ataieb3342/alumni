'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

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

interface PostCarouselProps {
  posts: Post[]
  title: string
  viewAllLink?: string
}

export default function PostCarousel({ posts, title, viewAllLink }: PostCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const itemsPerSlide = 2

  if (posts.length === 0) {
    return null
  }

  // Calculer le nombre total de slides (groupes de 2)
  const totalSlides = Math.ceil(posts.length / itemsPerSlide)

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Obtenir les posts pour le slide actuel
  const getPostsForSlide = (slideIndex: number) => {
    const start = slideIndex * itemsPerSlide
    return posts.slice(start, start + itemsPerSlide)
  }

  return (
    <div className="mb-12">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 min-w-0 break-words">{title}</h2>
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Voir tout →
          </Link>
        )}
      </div>

      <div className="relative">
        {/* Carousel Container */}
        <div className="overflow-hidden rounded-lg">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {Array.from({ length: totalSlides }).map((_, slideIndex) => (
              <div
                key={slideIndex}
                className="w-full flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-6 px-2"
              >
                {getPostsForSlide(slideIndex).map((post) => (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug.current}`}
                    className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow h-full"
                  >
                    <div className="relative h-48 bg-gray-200">
                      {post.mainImage?.asset?.url ? (
                        <Image
                          src={post.mainImage.asset.url}
                          alt={post.mainImage.alt || post.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-500 to-purple-600">
                          <span className="text-white text-6xl font-bold">
                            {post.title.charAt(0)}
                          </span>
                        </div>
                      )}
                      {post.visibility === 'alumni' && (
                        <span className="absolute top-4 right-4 bg-yellow-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Alumni seulement
                        </span>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <Calendar className="w-4 h-4" />
                        <time dateTime={post.publishedAt}>
                          {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </time>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-gray-600 line-clamp-3">{post.excerpt}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        {posts.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
              aria-label="Précédent"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
              aria-label="Suivant"
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {totalSlides > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-blue-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Aller à la diapositive ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
