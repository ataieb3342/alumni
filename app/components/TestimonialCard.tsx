'use client'

import Link from 'next/link'
import { getImageProps, urlFor } from '@/sanity/lib/image'

interface Author {
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
  author: Author
}

interface TestimonialCardProps {
  testimonial: Testimonial
}

const typeConfig: Record<string, { emoji: string; label: string; color: string }> = {
  studies: { emoji: '🎓', label: 'Études & Formation', color: 'bg-blue-100 text-blue-700' },
  company: { emoji: '💼', label: 'Entreprise & Stage', color: 'bg-purple-100 text-purple-700' },
  career: { emoji: '🚀', label: 'Parcours Pro', color: 'bg-green-100 text-green-700' },
  international: { emoji: '🌍', label: 'International', color: 'bg-orange-100 text-orange-700' },
  mentoring: { emoji: '💡', label: 'Conseil & Mentorat', color: 'bg-yellow-100 text-yellow-700' },
  project: { emoji: '🎯', label: 'Projet', color: 'bg-pink-100 text-pink-700' },
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const config = typeConfig[testimonial.type] || typeConfig.studies
  const authorImageUrl = testimonial.author.profileImage
    ? urlFor(testimonial.author.profileImage).width(100).height(100).url()
    : null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
    })
  }

  return (
    <Link href={`/temoignages/${testimonial.slug.current}`} className="group block h-full">
      <article className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 h-full flex flex-col border border-white/20 hover:border-white/40 transform hover:-translate-y-1">
        {/* Image de couverture si disponible */}
        {testimonial.featuredImage && (
          <div className="relative h-40 overflow-hidden">
            <img
              src={urlFor(testimonial.featuredImage).width(600).height(300).url()}
              alt={testimonial.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        )}

        <div className="p-6 flex-1 flex flex-col">
          {/* Header avec badge */}
          <div className="flex items-start justify-between mb-4">
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${config.color}`}>
              <span>{config.emoji}</span>
              <span>{config.label}</span>
            </span>
            {testimonial.rating && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded-lg">
                <span className="text-yellow-500 text-xs">⭐</span>
                <span className="text-xs font-semibold text-gray-700">{testimonial.rating}/5</span>
              </div>
            )}
          </div>

          {/* Titre */}
          <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {testimonial.title}
          </h3>

          {/* Extrait */}
          <p className="text-gray-600 mb-4 line-clamp-3 flex-1 text-sm leading-relaxed">
            {testimonial.excerpt}
          </p>

          {/* Tags */}
          {testimonial.tags && testimonial.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {testimonial.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer avec auteur */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {authorImageUrl ? (
                  <img
                    src={authorImageUrl}
                    alt={`${testimonial.author.firstName} ${testimonial.author.lastName}`}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium ring-2 ring-white shadow-sm">
                    {testimonial.author.firstName[0]}
                    {testimonial.author.lastName[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium truncate">
                    {testimonial.author.firstName} {testimonial.author.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(testimonial.publishedAt)}
                  </p>
                </div>
              </div>
              {/* Likes et indicateur cliquable */}
              <div className="flex items-center gap-2">
                {testimonial.likes !== undefined && testimonial.likes > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg">
                    <span className="text-red-500 text-xs">❤️</span>
                    <span className="text-xs text-gray-600 font-medium">{testimonial.likes}</span>
                  </div>
                )}
                <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
