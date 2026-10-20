'use client'

import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'

const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }
const LABELS: Record<Theme, string> = { system: 'Thème : automatique', light: 'Thème : clair', dark: 'Thème : sombre' }

/** Script inline appliqué avant le premier rendu (évite le flash de thème) */
export const THEME_SCRIPT = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme')
      // Synchronisation avec le stockage local, lu seulement côté navigateur
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored === 'light' || stored === 'dark') setTheme(stored)
    } catch {
      // stockage indisponible : thème automatique
    }
  }, [])

  const apply = (next: Theme) => {
    setTheme(next)
    try {
      if (next === 'system') {
        localStorage.removeItem('theme')
        delete document.documentElement.dataset.theme
      } else {
        localStorage.setItem('theme', next)
        document.documentElement.dataset.theme = next
      }
    } catch {
      if (next !== 'system') document.documentElement.dataset.theme = next
    }
  }

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor
  return (
    <button
      type="button"
      onClick={() => apply(NEXT[theme])}
      title={`${LABELS[theme]} (cliquer pour changer)`}
      aria-label={`${LABELS[theme]}. Changer de thème`}
      className={cn('inline-flex size-10 items-center justify-center rounded-full text-ink-soft hover:bg-paper-sunken hover:text-ink focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]', className)}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  )
}
