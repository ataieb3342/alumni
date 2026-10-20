'use client'

import { createElement, useEffect, useRef, useState, type ElementType, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { useEditor, useFieldValue } from './EditorShell'

export const editableOutline =
  'outline-2 outline-offset-4 outline-dashed outline-transparent rounded-[2px] transition-[outline-color] ' +
  'hover:outline-[color-mix(in_srgb,var(--blue)_55%,transparent)] focus:outline-solid focus:outline-blue cursor-text'

/**
 * Texte modifiable en cliquant dessus. Élément non contrôlé pendant la
 * saisie (pas de saut de curseur) ; la valeur part dans le brouillon, qui
 * s'enregistre seul après une pause.
 */
export function EditableText({
  docKey,
  path,
  initial,
  as = 'span',
  className,
  multiline = false,
  label,
  placeholder = 'Cliquez pour écrire…',
  maxLength,
}: {
  docKey: string
  path: string
  initial: string
  as?: ElementType
  className?: string
  multiline?: boolean
  label: string
  placeholder?: string
  maxLength?: number
}) {
  const editor = useEditor()
  const [value, setValue] = useFieldValue<string>(docKey, path, initial)
  const ref = useRef<HTMLElement>(null)
  // Contenu initial figé : React ne réécrit plus le texte pendant la frappe
  const [initialHtml] = useState(() => escapeHtml(value))

  // Synchronise le DOM quand la valeur change de l'extérieur (restauration, rendu serveur)
  useEffect(() => {
    const element = ref.current
    if (element && document.activeElement !== element && element.innerText !== value) {
      element.innerText = value
    }
  }, [value])

  if (!editor?.editMode) {
    return createElement(as, { className: cn(className, multiline && 'whitespace-pre-line') }, value)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' && !multiline) {
      event.preventDefault()
      ;(event.currentTarget as HTMLElement).blur()
    }
    if (event.key === 'Escape') (event.currentTarget as HTMLElement).blur()
  }

  const Tag = as
  return (
    <Tag
      ref={ref}
      className={cn(className, editableOutline, multiline && 'whitespace-pre-line', 'empty:before:text-ink-muted/70 empty:before:italic empty:before:content-[attr(data-placeholder)]')}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-label={label}
      aria-multiline={multiline || undefined}
      data-placeholder={placeholder}
      data-editable={path}
      spellCheck
      onKeyDown={onKeyDown}
      onPaste={(event: React.ClipboardEvent<HTMLElement>) => {
        // Collage en texte brut uniquement
        event.preventDefault()
        const text = event.clipboardData.getData('text/plain')
        document.execCommand('insertText', false, multiline ? text : text.replace(/\s*\n\s*/g, ' '))
      }}
      onInput={(event: React.FormEvent<HTMLElement>) => {
        let text = event.currentTarget.innerText.replace(/\u00a0/g, ' ')
        if (!multiline) text = text.replace(/\n/g, ' ')
        if (maxLength && text.length > maxLength) text = text.slice(0, maxLength)
        setValue(text)
      }}
      onBlur={(event: React.FocusEvent<HTMLElement>) => {
        const text = event.currentTarget.innerText.trim()
        if (text !== value) setValue(text)
      }}
      dangerouslySetInnerHTML={{ __html: initialHtml }}
    />
  )
}

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
