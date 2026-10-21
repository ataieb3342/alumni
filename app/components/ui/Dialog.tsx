'use client'

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'
import { Input } from './Field'

/**
 * Boîte de dialogue modale sur l'élément natif <dialog> : piège à focus,
 * fermeture par Échap et retour du focus sont assurés par le navigateur.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // Clic sur le fond (hors du contenu) : fermeture
        if (event.target === ref.current) onClose()
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] rounded-[var(--radius-lg)] border border-line bg-paper-raised p-0 text-ink shadow-[var(--shadow-lg)]',
        'backdrop:bg-[rgb(10_12_25/0.55)] backdrop:backdrop-blur-[2px]',
        'open:animate-rise',
        size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl'
      )}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 pt-5 pb-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-xl text-ink">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-sm text-ink-soft">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="-mr-2 rounded-full p-2 text-ink-muted hover:bg-paper-sunken hover:text-ink focus-visible:shadow-[var(--focus-ring)] focus-visible:outline-none"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          {children && <div className="overflow-y-auto px-6 py-5">{children}</div>}
          {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-line bg-paper px-6 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}

interface ConfirmOptions {
  title: string
  body?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  /** Mot à recopier pour confirmer (suppressions définitives) */
  requireText?: string
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<Confirm | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (value: boolean) => void }) | null>(null)
  const [typed, setTyped] = useState('')

  const confirm = useCallback<Confirm>(
    (options) =>
      new Promise<boolean>((resolve) => {
        setTyped('')
        setState({ ...options, resolve })
      }),
    []
  )

  const close = (value: boolean) => {
    state?.resolve(value)
    setState(null)
  }

  const blocked = !!state?.requireText && typed.trim() !== state.requireText

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={!!state}
        onClose={() => close(false)}
        title={state?.title ?? ''}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => close(false)}>
              {state?.cancelLabel ?? 'Annuler'}
            </Button>
            <Button variant={state?.tone === 'primary' ? 'primary' : 'danger'} disabled={blocked} onClick={() => close(true)} autoFocus={!state?.requireText}>
              {state?.confirmLabel ?? 'Confirmer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-ink-soft">
          {state?.body}
          {state?.requireText && (
            <div className="space-y-1.5">
              <label htmlFor="confirm-text" className="text-sm font-semibold text-ink">
                Tapez <span className="font-mono text-red">{state.requireText}</span> pour confirmer
              </label>
              <Input id="confirm-text" value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" autoFocus />
            </div>
          )}
        </div>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

/** Demande de confirmation (toute suppression passe par là) */
export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm doit être utilisé sous <ConfirmProvider>')
  return confirm
}
