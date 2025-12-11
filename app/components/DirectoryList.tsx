'use client'

import { useState, useMemo, useEffect } from 'react'
import Pagination from './Pagination'
import DirectoryCard from './DirectoryCard'
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
  staffCategory?: string
  staffDetails?: string
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
          <DirectoryCard users={currentUsers} />

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