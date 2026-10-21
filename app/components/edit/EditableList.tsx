'use client'

import { Children, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from 'lucide-react'
import { getAt, setAt } from '@/lib/content/path'
import { newId } from '@/lib/ids'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/app/components/ui/Dialog'
import { useEditor } from './EditorShell'

/**
 * Liste éditable : ajouter, supprimer (avec confirmation), réordonner par
 * glisser-déposer ou avec les flèches (accessible au clavier). Chaque
 * modification est enregistrée dans le brouillon puis la page est re-rendue.
 */
export function EditableList({
  docKey,
  path,
  children,
  newItem,
  itemLabel,
  className,
  itemClassName,
  max,
  as: Tag = 'ul',
}: {
  docKey: string
  path: string
  children: ReactNode
  newItem: Record<string, unknown>
  itemLabel: string
  className?: string
  itemClassName?: string
  max?: number
  as?: 'ul' | 'ol' | 'div'
}) {
  const editor = useEditor()
  const confirm = useConfirm()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const items = Children.toArray(children)
  const ItemTag = Tag === 'div' ? 'div' : 'li'

  if (!editor?.editMode) {
    return (
      <Tag className={className}>
        {items.map((child, index) => (
          <ItemTag key={index} className={itemClassName}>
            {child}
          </ItemTag>
        ))}
      </Tag>
    )
  }

  const list = () => ((getAt(editor.docs[docKey]?.data, path) as unknown[]) ?? []).slice()
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return
    void editor.commit(docKey, (data) => {
      const next = list()
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return setAt(data, path, next)
    })
  }

  return (
    <Tag className={cn(className, 'relative')}>
      {items.map((child, index) => (
        <ItemTag
          key={index}
          className={cn(
            itemClassName,
            'group/item relative rounded-[var(--radius-md)] outline-2 outline-offset-4 outline-dashed outline-transparent hover:outline-blue/40',
            dragIndex === index && 'opacity-50',
            overIndex === index && dragIndex !== index && 'outline-highlight outline-solid'
          )}
          onDragOver={(event) => {
            if (dragIndex === null) return
            event.preventDefault()
            setOverIndex(index)
          }}
          onDrop={(event) => {
            event.preventDefault()
            if (dragIndex !== null) move(dragIndex, index)
            setDragIndex(null)
            setOverIndex(null)
          }}
        >
          <div
            role="toolbar"
            aria-label={`${itemLabel} ${index + 1}`}
            className="absolute -top-4 right-2 z-20 flex items-center gap-0.5 rounded-full border border-line bg-paper-raised p-0.5 shadow-[var(--shadow-md)] opacity-0 transition-opacity group-hover/item:opacity-100 focus-within:opacity-100"
          >
            <span
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => {
                setDragIndex(null)
                setOverIndex(null)
              }}
              className="inline-flex size-8 cursor-grab items-center justify-center rounded-full text-ink-muted hover:bg-paper-sunken active:cursor-grabbing"
              title="Glisser pour déplacer"
              aria-hidden="true"
            >
              <GripVertical className="size-4" />
            </span>
            <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} aria-label={`Monter ${itemLabel.toLowerCase()} ${index + 1}`} className="inline-flex size-8 items-center justify-center rounded-full text-ink-soft hover:bg-paper-sunken disabled:opacity-30">
              <ArrowUp className="size-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => move(index, index + 1)} disabled={index === items.length - 1} aria-label={`Descendre ${itemLabel.toLowerCase()} ${index + 1}`} className="inline-flex size-8 items-center justify-center rounded-full text-ink-soft hover:bg-paper-sunken disabled:opacity-30">
              <ArrowDown className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`Supprimer ${itemLabel.toLowerCase()} ${index + 1}`}
              onClick={async () => {
                const ok = await confirm({ title: `Supprimer cet élément (${itemLabel.toLowerCase()}) ?`, body: 'Il disparaîtra du brouillon. Vous pourrez le retrouver dans l’historique.', confirmLabel: 'Supprimer' })
                if (ok) void editor.commit(docKey, (data) => setAt(data, path, list().filter((_, i) => i !== index)))
              }}
              className="inline-flex size-8 items-center justify-center rounded-full text-red hover:bg-red-soft"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
          {child}
        </ItemTag>
      ))}
      {(max === undefined || items.length < max) && (
        <ItemTag className="flex">
          <button
            type="button"
            onClick={() => void editor.commit(docKey, (data) => setAt(data, path, [...list(), { ...newItem, id: newId(10) }]))}
            className="flex min-h-24 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed border-blue/50 px-4 py-6 font-semibold text-blue hover:border-blue hover:bg-blue-soft"
          >
            <Plus className="size-5" aria-hidden="true" /> Ajouter : {itemLabel.toLowerCase()}
          </button>
        </ItemTag>
      )}
    </Tag>
  )
}
