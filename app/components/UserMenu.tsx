// app/components/UserMenu.tsx
'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { urlFor } from '@/sanity/lib/image'

interface UserMenuProps {
  user?: {
    id?: string
    name?: string | null
    email?: string | null
    userType?: string
    profileImage?: {
      asset?: {
        url?: string
      }
    }
  } | null;
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Si user est undefined ou null, ne rien afficher
  if (!user) {
    return null
  }

  const userTypeLabels: Record<string, string> = {
    current_student: 'Élève',
    alumni: 'Alumni',
    staff: 'Personnel',
  }

  const profileImageUrl = user.profileImage ? urlFor(user.profileImage).width(96).height(96).url() : null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-white hover:text-cyan-400 transition-colors group"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-slate-700 group-hover:ring-cyan-400 transition-all shadow-lg">
          {profileImageUrl ? (
            <Image
              src={profileImageUrl}
              alt={user.name || 'User'}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <span className="hidden lg:inline font-medium">{user.name}</span>
        <svg className="w-4 h-4 transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl z-20 overflow-hidden border border-slate-200">
            <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-cyan-400 flex-shrink-0">
                  {profileImageUrl ? (
                    <Image
                      src={profileImageUrl}
                      alt={user.name || 'User'}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  {user.userType && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-800 rounded-full">
                      {userTypeLabels[user.userType]}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="py-2">
              <Link
                href="/profil"
                className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-slate-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">Mon profil</span>
              </Link>
              <Link
                href="/parametres"
                className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-slate-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">Paramètres</span>
              </Link>
            </div>

            <div className="border-t border-slate-200 py-2">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors group"
              >
                <svg className="w-4 h-4 mr-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}