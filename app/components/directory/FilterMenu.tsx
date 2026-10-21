'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterMenuProps {
  /** Intitulé du bouton, qui reprend la valeur choisie (« Promo 2019 ») */
  label: ReactNode
  /** Titre du panneau */
  title: string
  active: boolean
  /** Nombre de résultats, pour le bouton de validation sur mobile */
  resultCount: number
  children: (close: () => void) => ReactNode
}

/**
 * Bouton de filtre qui ouvre un menu déroulant sur ordinateur et un panneau
 * montant depuis le bas de l'écran sur mobile.
 */
export default function FilterMenu({ label, title, active, resultCount, children }: FilterMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const buttonId = useId()

  // Rend le focus au bouton, pour qu'un utilisateur au clavier ne se retrouve
  // pas en haut de la page (par l'id : close est transmis pendant le rendu)
  const close = () => {
    setOpen(false)
    document.getElementById(buttonId)?.focus()
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        document.getElementById(buttonId)?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, buttonId])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex h-10 items-center gap-1.5 rounded-full border pr-3 pl-4 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
          active ? 'border-blue bg-blue-soft text-blue' : 'border-line-strong/50 bg-paper-raised text-ink-soft hover:border-ink'
        )}
      >
        {label}
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <>
          {/* Fond assombri, sur mobile seulement */}
          <div className="fixed inset-0 z-40 bg-[rgb(10_12_25/0.5)] sm:hidden" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            id={panelId}
            role="dialog"
            aria-label={title}
            className="animate-rise fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[var(--radius-lg)] border-t border-line bg-paper-raised p-5 shadow-[var(--shadow-lg)] sm:absolute sm:inset-x-auto sm:top-full sm:bottom-auto sm:left-0 sm:mt-2 sm:max-h-[70vh] sm:w-96 sm:max-w-[calc(100vw-2rem)] sm:rounded-[var(--radius-md)] sm:border sm:p-4"
          >
            <div className="flex items-center justify-between mb-4 sm:hidden">
              <p className="font-display text-xl text-ink">{title}</p>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer"
                className="-mr-2 rounded-full p-2 text-ink-muted hover:bg-paper-sunken"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {children(close)}

            <button
              type="button"
              onClick={close}
              className="mt-5 w-full rounded-[var(--radius-sm)] bg-blue py-3 font-semibold text-on-blue shadow-[0_3px_0_0_var(--blue-strong)] sm:hidden"
            >
              Voir {resultCount} membre{resultCount > 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
