/**
 * Aide côté serveur pour écrire une page éditable une seule fois :
 *
 *   const e = createEditor('content:home', content, editMode)
 *   <h1>{e.text('hero.title', { label: 'Titre' })}</h1>
 *
 * Pour un visiteur (ou en mode lecture), chaque appel produit du HTML
 * statique, sans JavaScript d'édition. En mode édition, il produit le
 * composant client correspondant (texte, texte riche, image, lien, liste).
 */
import { createElement, Fragment, type ElementType, type ReactNode } from 'react'
import Link from 'next/link'
import type { ImageRef } from '@/db/schema'
import { getAt } from '@/lib/content/path'
import { cn } from '@/lib/utils'
import { ContentIcon } from '@/app/components/ui/icons'
import { EditableText } from './EditableText'
import { EditableRichText } from './EditableRichText'
import { EditableImage } from './EditableImage'
import { EditableLink } from './EditableLink'
import { EditableList } from './EditableList'
import { EditableIcon } from './EditableIcon'

interface TextOptions {
  as?: string
  className?: string
  multiline?: boolean
  label: string
  placeholder?: string
  maxLength?: number
  /** Transformation à l'affichage seulement (ex. remplacement de `{count}`) */
  display?: (value: string) => string
}

export type Editor = ReturnType<typeof createEditor>

export function createEditor(docKey: string, data: unknown, enabled: boolean) {
  const get = <V = unknown,>(path: string) => getAt(data, path) as V

  return {
    enabled,
    docKey,
    get,

    text(path: string, options: TextOptions): ReactNode {
      const value = String(get(path) ?? '')
      if (!enabled) {
        return createElement((options.as ?? 'span') as ElementType, { className: cn(options.className, options.multiline && 'whitespace-pre-line') }, options.display ? options.display(value) : value)
      }
      return (
        <EditableText
          docKey={docKey}
          path={path}
          initial={value}
          as={(options.as ?? 'span') as ElementType}
          className={options.className}
          multiline={options.multiline}
          label={options.label}
          placeholder={options.placeholder}
          maxLength={options.maxLength}
        />
      )
    },

    rich(path: string, options: { className?: string; label: string }): ReactNode {
      const value = String(get(path) ?? '')
      if (!enabled) return <div className={cn('prose-cahier', options.className)} dangerouslySetInnerHTML={{ __html: value }} />
      return <EditableRichText docKey={docKey} path={path} initial={value} className={options.className} label={options.label} />
    },

    image(path: string, render: (image: ImageRef | null) => ReactNode, options: { className?: string; label?: string; allowRemove?: boolean } = {}): ReactNode {
      const image = (get<ImageRef | null>(path) ?? null) as ImageRef | null
      if (!enabled) return <div className={options.className}>{render(image)}</div>
      return (
        <EditableImage docKey={docKey} path={path} className={options.className} label={options.label} allowRemove={options.allowRemove}>
          {render(image)}
        </EditableImage>
      )
    },

    link(path: string, options: { className?: string; icon?: ReactNode; iconRight?: ReactNode } = {}): ReactNode {
      const link = get<{ label: string; href: string }>(path) ?? { label: '', href: '/' }
      if (!enabled) {
        return (
          <Link href={link.href || '/'} className={options.className}>
            {options.icon}
            <span>{link.label}</span>
            {options.iconRight}
          </Link>
        )
      }
      return <EditableLink docKey={docKey} path={path} initial={link} className={options.className} icon={options.icon} iconRight={options.iconRight} />
    },

    icon(path: string, options: { className?: string } = {}): ReactNode {
      const name = String(get(path) ?? 'sparkles')
      if (!enabled) return <ContentIcon name={name} className={options.className} />
      return <EditableIcon docKey={docKey} path={path} initial={name} className={options.className} />
    },

    list<I extends { id: string }>(
      path: string,
      render: (item: I, index: number, itemPath: string) => ReactNode,
      options: {
        newItem: Omit<I, 'id'>
        itemLabel: string
        className?: string
        itemClassName?: string
        as?: 'ul' | 'ol' | 'div'
        max?: number
      }
    ): ReactNode {
      const items = (get<I[]>(path) ?? []) as I[]
      const Tag = options.as ?? 'ul'
      const ItemTag = Tag === 'div' ? 'div' : 'li'
      if (!enabled) {
        return (
          <Tag className={options.className}>
            {items.map((item, index) => (
              <ItemTag key={item.id} className={options.itemClassName}>
                {render(item, index, `${path}.${index}`)}
              </ItemTag>
            ))}
          </Tag>
        )
      }
      return (
        <EditableList
          docKey={docKey}
          path={path}
          newItem={options.newItem as Record<string, unknown>}
          itemLabel={options.itemLabel}
          className={options.className}
          itemClassName={options.itemClassName}
          as={Tag}
          max={options.max}
        >
          {items.map((item, index) => (
            <Fragment key={item.id}>{render(item, index, `${path}.${index}`)}</Fragment>
          ))}
        </EditableList>
      )
    },
  }
}
