'use client'

import { useState } from 'react'

interface BlogFiltersProps {
  onSearch: (query: string) => void
  onYearFilter: (year: string) => void
  onSort: (sort: string) => void
  availableYears: number[]
}

export default function BlogFilters({
  onSearch,
  onYearFilter,
  onSort,
  availableYears,
}: BlogFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSort, setSelectedSort] = useState('date-desc')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearch(value)
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedYear(value)
    onYearFilter(value)
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedSort(value)
    onSort(value)
  }

  return (
    <div className="mb-8">
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
              id="search"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Rechercher par titre ou description..."
              className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Filtre par année */}
        <div className="w-full sm:w-48">
          <select
            id="year"
            value={selectedYear}
            onChange={handleYearChange}
            className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
          >
            <option value="" className="text-gray-500">Toutes les années</option>
            {availableYears.map((year) => (
              <option key={year} value={year} className="text-gray-900">
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Tri */}
        <div className="w-full sm:w-48">
          <select
            id="sort"
            value={selectedSort}
            onChange={handleSortChange}
            className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
          >
            <option value="date-desc" className="text-gray-900">Plus récent</option>
            <option value="date-asc" className="text-gray-900">Plus ancien</option>
            <option value="title-asc" className="text-gray-900">Titre (A-Z)</option>
            <option value="title-desc" className="text-gray-900">Titre (Z-A)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
