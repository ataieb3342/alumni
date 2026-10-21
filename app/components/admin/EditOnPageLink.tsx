'use client'

import { useRouter } from 'next/navigation'
import { PenLine } from 'lucide-react'
import { buttonClasses } from '@/app/components/ui/Button'

/** Ouvre la page en mode édition (le serveur revérifie le rôle avant d'afficher les brouillons) */
export function EditOnPageLink({ href, label = 'Modifier sur la page' }: { href: string; label?: string }) {
  const router = useRouter()
  return (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault()
        document.cookie = `edit_mode=1; path=/; samesite=strict${location.protocol === 'https:' ? '; secure' : ''}`
        router.push(href)
        router.refresh()
      }}
      className={buttonClasses('secondary', 'sm')}
    >
      <PenLine className="size-4" aria-hidden="true" /> {label}
    </a>
  )
}
