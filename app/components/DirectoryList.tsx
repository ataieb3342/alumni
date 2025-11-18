'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import Pagination from './Pagination'
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
}

interface DirectoryListProps {
  alumni: User[]
  staff: User[]
}

const USERS_PER_PAGE = 12

export default function DirectoryList({ alumni, staff }: DirectoryListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPromotion, setSelectedPromotion] = useState<string>('')
  const [selectedType, setSelectedType] = useState<'all' | 'alumni' | 'staff'>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const allUsers = [...alumni, ...staff]
  const currentList = selectedType === 'all' ? allUsers : selectedType === 'alumni' ? alumni : staff

  // Filtrage
  const filteredUsers = useMemo(() => {
    return currentList.filter((user) => {
      // Extraire les infos les plus récentes (expérience ou formation)
      const { currentJob, company, currentCity } = getMostRecentActivity(user)

      const matchesSearch =
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        currentJob?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        currentCity?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesPromotion =
        !selectedPromotion ||
        user.promotionYear?.toString() === selectedPromotion

      return matchesSearch && matchesPromotion
    })
  }, [currentList, searchTerm, selectedPromotion])

  // Reset à la première page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedPromotion, selectedType])

  // Pagination
  const indexOfLastUser = currentPage * USERS_PER_PAGE
  const indexOfFirstUser = indexOfLastUser - USERS_PER_PAGE
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE)

  // Extraire les années de promotion uniques
  const promotionYears = Array.from(
    new Set(alumni.map(u => u.promotionYear).filter(Boolean))
  ).sort((a, b) => (b as number) - (a as number))

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Recherche */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Nom, entreprise, poste, ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Filtre par type */}
        <div className="w-full sm:w-48">
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value as 'all' | 'alumni' | 'staff')
              setSelectedPromotion('')
            }}
            className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
          >
            <option value="all">Tous ({allUsers.length})</option>
            <option value="alumni">Anciens élèves ({alumni.length})</option>
            <option value="staff">Personnel ({staff.length})</option>
          </select>
        </div>

        {/* Filtre par promotion (seulement pour alumni) */}
        {(selectedType === 'alumni' || selectedType === 'all') && promotionYears.length > 0 && (
          <div className="w-full sm:w-48">
            <select
              value={selectedPromotion}
              onChange={(e) => setSelectedPromotion(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
            >
              <option value="" className="text-gray-500">Promotions</option>
              {promotionYears.map((year) => (
                <option key={year} value={year?.toString()} className="text-gray-900">
                  {year}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Liste des utilisateurs */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-white/20">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun résultat trouvé</h3>
            <p className="text-gray-600">
              Essayez de modifier vos critères de recherche.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentUsers.map((user) => {
              // Extraire les infos les plus récentes (expérience ou formation)
              const { currentJob, company, currentCity } = getMostRecentActivity(user)

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
                    src={urlFor(user.coverImage).width(800).height(192).fit('crop').crop('center').url()}
                    alt="Couverture"
                    width={800}
                    height={96}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="w-full h-24 bg-gradient-to-br from-blue-600 to-blue-800"></div>
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
                          src={urlFor(user.profileImage).width(160).height(160).fit('crop').crop('center').url()}
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

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </>
      )}
    </div>
  )
}