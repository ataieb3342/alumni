'use client'

import { ReactNode } from 'react'

interface SettingsLayoutProps {
  children: ReactNode
  title: string
  description: string
}

export default function SettingsLayout({ children, title, description }: SettingsLayoutProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      {/* En-tête de section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-6">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-blue-100">{description}</p>
      </div>

      {/* Contenu */}
      <div className="p-8">
        {children}
      </div>
    </div>
  )
}
