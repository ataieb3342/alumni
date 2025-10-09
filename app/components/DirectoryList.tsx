'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  userType: string
  phone?: string
  promotionYear?: number
  currentJob?: string
  company?: string
  linkedIn?: string
  bio?: string
  profileImage?: any
}

interface DirectoryListProps {
  alumni: User[]
  staff: User[]
}

export default function DirectoryList({ alumni, staff }: DirectoryListProps) {
  const [activeTab, setActiveTab] = useState<'alumni' | 'staff'>('alumni')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPromotion, setSelectedPromotion] = useState<string>('all')

  const currentList = activeTab === 'alumni' ? alumni : staff

  // Filtrage
  const filteredUsers = currentList.filter((user) => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.currentJob?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPromotion = 
      selectedPromotion === 'all' || 
      user.promotionYear?.toString() === selectedPromotion

    return matchesSearch && matchesPromotion
  })

  // Extraire les années de promotion uniques
  const promotionYears = Array.from(
    new Set(alumni.map(u => u.promotionYear).filter(Boolean))
  ).sort((a, b) => (b as number) - (a as number))

  return (
    <div className="space-y-6">
      {/* Onglets */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => {
            setActiveTab('alumni')
            setSelectedPromotion('all')
          }}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === 'alumni'
              ? 'border-b-2 border-blue-900 text-blue-900'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Anciens élèves ({alumni.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('staff')
            setSelectedPromotion('all')
          }}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === 'staff'
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Personnel ({staff.length})
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <input
              type="text"
              placeholder="Nom, entreprise, poste..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {activeTab === 'alumni' && promotionYears.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promotion
              </label>
              <select
                value={selectedPromotion}
                onChange={(e) => setSelectedPromotion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
              >
                <option value="all">Toutes les promotions</option>
                {promotionYears.map((year) => (
                  <option key={year} value={year?.toString()}>
                    Promotion {year}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Résultats */}
      <div className="text-gray-600 mb-4">
        {filteredUsers.length} résultat{filteredUsers.length > 1 ? 's' : ''}
      </div>

      {/* Liste des utilisateurs */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600">Aucun résultat trouvé</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Link
              key={user._id}
              href={`/annuaire/${user._id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
            >
              {/* Image de profil ou initiales */}
              <div className="h-48 bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center relative">
                {user.profileImage ? (
                  <Image
                    src={urlFor(user.profileImage).width(400).height(400).url()}
                    alt={`${user.firstName} ${user.lastName}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-6xl font-bold text-white">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                )}
              </div>

              {/* Informations */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-900 transition">
                  {user.firstName} {user.lastName}
                </h3>

                {user.promotionYear && (
                  <p className="text-sm text-gray-600 mb-2">
                    Promotion {user.promotionYear}
                  </p>
                )}

                {user.currentJob && (
                  <p className="text-gray-700 font-semibold mb-1">
                    {user.currentJob}
                  </p>
                )}

                {user.company && (
                  <p className="text-gray-600 text-sm mb-3">
                    {user.company}
                  </p>
                )}

                {user.bio && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {user.bio}
                  </p>
                )}

                <span className="text-blue-900 text-sm font-semibold group-hover:underline">
                  Voir le profil →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}