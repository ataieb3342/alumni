'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2, Unlink } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Éditeur de texte riche (Tiptap) limité aux styles autorisés par
 * l'assainissement serveur : titres H2/H3, citation, listes, gras, italique,
 * liens. Le HTML produit est de nouveau assaini à l'enregistrement.
 */
export default function RichTextEditor({ value, onChange, className, label }: { value: string; onChange: (html: string) => void; className?: string; label: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, protocols: ['mailto', 'tel'] },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn('prose-cahier min-h-24 outline-none', className),
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': label,
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  })

  if (!editor) return null

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const href = window.prompt('Adresse du lien (https://…, mailto:…, /page)', previous ?? 'https://')
    if (href === null) return
    if (href.trim() === '') editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run()
  }

  const tools = [
    { label: 'Gras', icon: Bold, active: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run() },
    { label: 'Italique', icon: Italic, active: editor.isActive('italic'), run: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Titre de section', icon: Heading2, active: editor.isActive('heading', { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Sous-titre', icon: Heading3, active: editor.isActive('heading', { level: 3 }), run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: 'Citation', icon: Quote, active: editor.isActive('blockquote'), run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: 'Liste à puces', icon: List, active: editor.isActive('bulletList'), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: 'Liste numérotée', icon: ListOrdered, active: editor.isActive('orderedList'), run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: 'Lien', icon: Link2, active: editor.isActive('link'), run: setLink },
    { label: 'Retirer le lien', icon: Unlink, active: false, run: () => editor.chain().focus().unsetLink().run(), hidden: !editor.isActive('link') },
    { label: 'Annuler', icon: Undo2, active: false, run: () => editor.chain().focus().undo().run() },
    { label: 'Rétablir', icon: Redo2, active: false, run: () => editor.chain().focus().redo().run() },
  ]

  return (
    <div className="rounded-[var(--radius-md)] border-2 border-dashed border-blue/40 bg-paper-raised/60 focus-within:border-solid focus-within:border-blue">
      <div role="toolbar" aria-label={`Mise en forme : ${label}`} className="sticky top-16 z-10 flex flex-wrap gap-0.5 rounded-t-[var(--radius-md)] border-b border-line bg-paper-raised p-1">
        {tools
          .filter((tool) => !tool.hidden)
          .map(({ label: toolLabel, icon: Icon, active, run }) => (
            <button
              key={toolLabel}
              type="button"
              title={toolLabel}
              aria-label={toolLabel}
              aria-pressed={active}
              onMouseDown={(event) => event.preventDefault()}
              onClick={run}
              className={cn('inline-flex size-9 items-center justify-center rounded-[var(--radius-xs)]', active ? 'bg-blue text-on-blue' : 'text-ink-soft hover:bg-paper-sunken hover:text-ink')}
            >
              <Icon className="size-4" aria-hidden="true" />
            </button>
          ))}
      </div>
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
