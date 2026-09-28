'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, X } from 'lucide-react'

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
        className={`inline-flex items-center gap-1.5 h-10 pl-4 pr-3 rounded-full border text-sm font-medium whitespace-nowrap transition-colors ${
          active
            ? 'bg-blue-50 border-blue-500 text-blue-800'
            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
        }`}
      >
        {label}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <>
          {/* Fond assombri, sur mobile seulement */}
          <div className="fixed inset-0 z-40 bg-gray-900/40 sm:hidden" aria-hidden="true" onClick={() => setOpen(false)} />
          <div
            id={panelId}
            role="dialog"
            aria-label={title}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-2 sm:w-96 sm:max-w-[calc(100vw-2rem)] sm:max-h-[70vh] sm:rounded-2xl sm:border sm:border-gray-200 sm:p-4"
          >
            <div className="flex items-center justify-between mb-4 sm:hidden">
              <p className="text-lg font-semibold text-gray-900">{title}</p>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer"
                className="p-2 -mr-2 rounded-full text-gray-500 hover:bg-gray-100"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {children(close)}

            <button
              type="button"
              onClick={close}
              className="mt-5 w-full py-3 rounded-xl bg-blue-600 text-white font-semibold sm:hidden"
            >
              Voir {resultCount} membre{resultCount > 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
