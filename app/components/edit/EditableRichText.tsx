'use client'

import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { useEditor, useFieldValue } from './EditorShell'

// L'éditeur (Tiptap) n'est chargé que pour un administrateur en mode édition
const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-24 animate-pulse rounded-[var(--radius-sm)] bg-paper-sunken" aria-hidden="true" />,
})

export function EditableRichText({ docKey, path, initial, className, label }: { docKey: string; path: string; initial: string; className?: string; label: string }) {
  const editor = useEditor()
  const [value, setValue] = useFieldValue<string>(docKey, path, initial)
  if (!editor?.editMode) {
    return <div className={cn('prose-cahier', className)} dangerouslySetInnerHTML={{ __html: value }} />
  }
  return <RichTextEditor value={value} onChange={setValue} className={className} label={label} />
}
