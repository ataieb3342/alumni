'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getImageProps } from '@/sanity/lib/image'
import { getMostRecentActivity } from '@/lib/userUtils'

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  userType: string
  promotionYear?: number
  linkedIn?: string
  bio?: string
  experience?: Array<{
    company: string
    position: string
    location?: string
    startDate: string
    endDate?: string
    current?: boolean
    description?: string
  }>
  education?: Array<{
    school: string
    degree: string
    field?: string
    startYear: number
    endYear?: number
    description?: string
  }>
  profileImage?: {
    asset: {
      _id: string
      url: string
    }
  }
  coverImage?: {
    asset: {
      _id: string
      url: string
    }
  }
  _createdAt?: string
}

interface DirectoryCardProps {
  users: User[]
  showNewBadge?: boolean
}

export default function DirectoryCard({ users, showNewBadge = false }: DirectoryCardProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user) => {
        // Extraire les infos les plus récentes (expérience ou formation)
        const { currentJob, company, currentCity } = getMostRecentActivity(user)

        // Vérifier si c'est un nouveau membre (inscrit il y a moins de 30 jours)
        const isNew = showNewBadge && user._createdAt
          ? (new Date().getTime() - new Date(user._createdAt).getTime()) / (1000 * 60 * 60 * 24) < 30
          : false

        return (
          <Link
            key={user._id}
            href={`/annuaire/${user._id}`}
            className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 group hover:border-blue-300 flex flex-col"
          >
            {/* Photo de couverture */}
            {user.coverImage ? (
              <div className="w-full h-24 overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 relative">
                <Image
                  {...getImageProps(user.coverImage, 800, 192)}
                  alt="Couverture"
                  width={800}
                  height={96}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                {isNew && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-500 text-white shadow-lg">
                      Nouveau
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-24 bg-gradient-to-br from-blue-600 to-blue-800 relative">
                {isNew && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-500 text-white shadow-lg">
                      Nouveau
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Contenu de la carte */}
            <div className="flex-1 flex flex-col relative">
              {/* Photo de profil et nom */}
              <div className="px-6 -mt-10 mb-4 relative z-10">
                <div className="flex items-end gap-4">
                  {/* Photo de profil */}
                  {user.profileImage ? (
                    <div className="w-20 h-20 rounded-xl overflow-hidden ring-4 ring-white shadow-lg group-hover:ring-blue-100 transition-all flex-shrink-0 bg-white">
                      <Image
                        {...getImageProps(user.profileImage, 160, 160)}
                        alt={`${user.firstName} ${user.lastName}`}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center ring-4 ring-white shadow-lg group-hover:ring-blue-100 transition-all flex-shrink-0">
                      <span className="text-2xl font-bold text-white">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Badge promo */}
                  {user.promotionYear && (
                    <div className="mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
                        Promo {user.promotionYear}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Nom et infos */}
              <div className="px-6 pb-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-3">
                  {user.firstName} {user.lastName}
                </h3>

                {/* Informations professionnelles */}
                <div className="space-y-2.5 flex-1">
                  {currentJob && (
                    <div className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                        {currentJob}
                      </p>
                    </div>
                  )}

                  {company && (
                    <div className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-sm text-gray-600 line-clamp-1 flex-1">
                        {company}
                      </p>
                    </div>
                  )}

                  {currentCity && (
                    <div className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm text-gray-600 flex-1">
                        {currentCity}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer avec CTA */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                    Voir le profil
                  </span>
                  <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
