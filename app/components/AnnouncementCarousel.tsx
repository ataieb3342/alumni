'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, MapPin, Building2 } from 'lucide-react'

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

interface AnnouncementCarouselProps {
  announcements: Announcement[]
  title: string
  viewAllLink?: string
}

const typeLabels: { [key: string]: string } = {
  job: 'Offre d\'emploi',
  internship: 'Stage',
  event: 'Événement',
  collaboration: 'Collaboration',
  other: 'Autre'
}

const typeColors: { [key: string]: string } = {
  job: 'bg-blue-100 text-blue-800',
  internship: 'bg-green-100 text-green-800',
  event: 'bg-purple-100 text-purple-800',
  collaboration: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800'
}

// Helper function to convert Sanity block content to plain text
function getDescriptionText(description: Announcement['description']): string {
  if (typeof description === 'string') {
    return description
  }

  if (Array.isArray(description)) {
    return description
      .map(block =>
        block.children
          .map(child => child.text)
          .join('')
      )
      .join(' ')
  }

  return ''
}

export default function AnnouncementCarousel({ announcements, title, viewAllLink }: AnnouncementCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const itemsPerSlide = 2

  if (announcements.length === 0) {
    return null
  }

  // Calculer le nombre total de slides (groupes de 2)
  const totalSlides = Math.ceil(announcements.length / itemsPerSlide)

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Obtenir les annonces pour le slide actuel
  const getAnnouncementsForSlide = (slideIndex: number) => {
    const start = slideIndex * itemsPerSlide
    return announcements.slice(start, start + itemsPerSlide)
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
                {getAnnouncementsForSlide(slideIndex).map((announcement) => (
                  <Link
                    key={announcement._id}
                    href={`/annonces/${announcement.slug.current}`}
                    className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow h-full"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            typeColors[announcement.type] || typeColors.other
                          }`}
                        >
                          {typeLabels[announcement.type] || announcement.type}
                        </span>
                        <time className="text-sm text-gray-500">
                          {new Date(announcement.publishedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </time>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                        {announcement.title}
                      </h3>

                      {announcement.company && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Building2 className="w-4 h-4" />
                          <span>{announcement.company}</span>
                        </div>
                      )}

                      {announcement.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <MapPin className="w-4 h-4" />
                          <span>{announcement.location}</span>
                        </div>
                      )}

                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {getDescriptionText(announcement.description)}
                      </p>

                      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                          {announcement.author.profileImage?.asset?.url ? (
                            <Image
                              src={announcement.author.profileImage.asset.url}
                              alt={`${announcement.author.firstName} ${announcement.author.lastName}`}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-blue-500 text-white font-semibold">
                              {announcement.author.firstName.charAt(0)}
                              {announcement.author.lastName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {announcement.author.firstName} {announcement.author.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {announcement.author.userType === 'alumni' ? 'Alumni' :
                             announcement.author.userType === 'student' ? 'Étudiant' : 'Personnel'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        {announcements.length > 1 && (
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
