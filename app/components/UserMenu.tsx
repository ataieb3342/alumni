'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'

interface UserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    userType?: string
  } | null;
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const userTypeLabels: Record<string, string> = {
    current_student: 'Élève',
    alumni: 'Alumni',
    staff: 'Personnel',
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 hover:text-blue-200 transition"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
          {user.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="hidden lg:inline">{user.name}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-20 overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <p className="font-semibold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              {user.userType && (
                <p className="text-xs text-blue-900 mt-1">
                  {userTypeLabels[user.userType]}
                </p>
              )}
            </div>
            
            <div className="py-2">
              <Link
                href="/profil"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                onClick={() => setIsOpen(false)}
              >
                Mon profil
              </Link>
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            </div>
            
            <div className="border-t py-2">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}