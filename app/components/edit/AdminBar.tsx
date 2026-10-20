'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Eye, History, LayoutDashboard, MoreHorizontal, PenLine, Save, Send, Trash2, Undo2, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/app/components/ui/Button'
import { Spinner } from '@/app/components/ui/Spinner'
import { useConfirm } from '@/app/components/ui/Dialog'
import { useEditor } from './EditorShell'
import { HistoryDialog } from './HistoryDialog'

function timeLabel(timestamp: number | null) {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Barre d'administration discrète, en bas de l'écran : bascule lecture /
 * édition, état du brouillon, enregistrer, publier, historique.
 */
export function AdminBar() {
  const editor = useEditor()
  const confirm = useConfirm()
  const [selected, setSelected] = useState<string | null>(null)
  const [historyFor, setHistoryFor] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  if (!editor) return null

  const docs = Object.values(editor.docs)
  const doc = docs.find((d) => d.key === selected) ?? docs[0]

  let status: { text: string; tone: 'muted' | 'warn' | 'ok' | 'error' } = { text: 'Rien à modifier sur cette page', tone: 'muted' }
  if (doc) {
    if (doc.error) status = { text: 'Erreur d’enregistrement', tone: 'error' }
    else if (doc.saving) status = { text: 'Enregistrement…', tone: 'muted' }
    else if (doc.dirty) status = { text: 'Modifications en cours', tone: 'warn' }
    else if (doc.status === 'draft') status = { text: doc.lastSavedAt ? `Brouillon enregistré à ${timeLabel(doc.lastSavedAt)} · jamais publié` : 'Brouillon · jamais publié', tone: 'warn' }
    else if (doc.hasDraft) status = { text: doc.lastSavedAt ? `Brouillon enregistré à ${timeLabel(doc.lastSavedAt)} · non publié` : 'Brouillon non publié', tone: 'warn' }
    else status = { text: 'À jour : version publiée', tone: 'ok' }
  }
  const canPublish = !!doc && (doc.dirty || doc.hasDraft || doc.status === 'draft')

  return (
    <>
      <div
        role="region"
        aria-label="Barre d'administration"
        className="fixed inset-x-0 bottom-3 z-[60] flex justify-center px-3 print:hidden"
      >
        <div className="flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-white/10 bg-wash py-1.5 pr-1.5 pl-2 text-on-wash shadow-[var(--shadow-lg)] scrollbar-none">
          <Link
            href="/admin"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-on-wash-soft hover:bg-white/10 hover:text-on-wash"
          >
            <LayoutDashboard className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Admin</span>
          </Link>

          <div role="group" aria-label="Mode d'affichage" className="flex shrink-0 rounded-full bg-white/10 p-0.5">
            <button
              type="button"
              aria-pressed={!editor.editMode}
              onClick={() => editor.editMode && editor.setEditMode(false)}
              className={cn('inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold', !editor.editMode ? 'bg-paper-raised text-ink' : 'text-on-wash-soft hover:text-on-wash')}
            >
              <Eye className="size-4" aria-hidden="true" /> Lecture
            </button>
            <button
              type="button"
              aria-pressed={editor.editMode}
              onClick={() => !editor.editMode && editor.setEditMode(true)}
              className={cn('inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-semibold', editor.editMode ? 'bg-highlight text-on-highlight' : 'text-on-wash-soft hover:text-on-wash')}
            >
              <PenLine className="size-4" aria-hidden="true" /> Édition
            </button>
          </div>

          {editor.editMode && (
            <>
              {docs.length > 1 && (
                <label className="shrink-0">
                  <span className="sr-only">Contenu à enregistrer</span>
                  <select
                    value={doc?.key}
                    onChange={(event) => setSelected(event.target.value)}
                    className="h-8 rounded-full border-0 bg-white/10 px-3 text-sm text-on-wash"
                  >
                    {docs.map((d) => (
                      <option key={d.key} value={d.key} className="text-ink">
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <p
                aria-live="polite"
                className={cn(
                  'flex shrink-0 items-center gap-1.5 px-2 text-xs sm:text-sm',
                  status.tone === 'error' ? 'text-[#ff9c8f]' : status.tone === 'warn' ? 'text-highlight' : status.tone === 'ok' ? 'text-[#8fe0b5]' : 'text-on-wash-soft'
                )}
              >
                {doc?.saving && <Spinner className="size-3.5" />}
                {status.text}
              </p>
              {doc && (
                <>
                  <Button
                    size="sm"
                    variant="on-wash"
                    icon={<Save className="size-4" aria-hidden="true" />}
                    disabled={!doc.dirty || doc.saving}
                    onClick={() => void editor.save(doc.key)}
                    title="Enregistrer le brouillon (Ctrl+S)"
                    className="shrink-0"
                  >
                    Enregistrer
                  </Button>
                  <Button
                    size="sm"
                    variant="highlight"
                    icon={<Send className="size-4" aria-hidden="true" />}
                    disabled={!canPublish || doc.saving}
                    onClick={() => void editor.publish(doc.key)}
                    className="shrink-0"
                  >
                    Publier
                  </Button>
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      aria-expanded={menuOpen}
                      aria-label="Plus d'actions"
                      onClick={() => setMenuOpen((value) => !value)}
                      className="inline-flex size-9 items-center justify-center rounded-full text-on-wash-soft hover:bg-white/10 hover:text-on-wash"
                    >
                      <MoreHorizontal className="size-5" aria-hidden="true" />
                    </button>
                    {menuOpen && (
                      <ul className="fixed bottom-16 right-3 z-[61] w-64 overflow-hidden rounded-[var(--radius-md)] border border-line bg-paper-raised p-1.5 text-ink shadow-[var(--shadow-lg)] sm:absolute sm:right-0 sm:bottom-12">
                        <li>
                          <MenuButton icon={History} onClick={() => { setMenuOpen(false); setHistoryFor(doc.key) }}>
                            Historique des versions
                          </MenuButton>
                        </li>
                        {doc.hasDraft && doc.status !== 'draft' && (
                          <li>
                            <MenuButton
                              icon={Undo2}
                              onClick={async () => {
                                setMenuOpen(false)
                                if (await confirm({ title: 'Abandonner le brouillon ?', body: 'Les modifications non publiées seront perdues (elles restent consultables dans l’historique).', confirmLabel: 'Abandonner' }))
                                  void editor.discard(doc.key)
                              }}
                            >
                              Revenir à la version publiée
                            </MenuButton>
                          </li>
                        )}
                        {doc.key.startsWith('post:') && doc.status === 'published' && (
                          <li>
                            <MenuButton
                              icon={EyeOff}
                              onClick={async () => {
                                setMenuOpen(false)
                                if (await confirm({ title: 'Retirer l’article du site ?', body: 'Il ne sera plus visible des visiteurs mais restera disponible en brouillon.', confirmLabel: 'Retirer', tone: 'primary' }))
                                  void editor.unpublish(doc.key)
                              }}
                            >
                              Retirer du site
                            </MenuButton>
                          </li>
                        )}
                        {doc.canDelete && (
                          <li>
                            <MenuButton
                              icon={Trash2}
                              danger
                              onClick={async () => {
                                setMenuOpen(false)
                                if (await confirm({ title: `Supprimer « ${doc.label} » ?`, body: 'L’article disparaîtra du site. Une copie reste dans l’historique.', confirmLabel: 'Supprimer', requireText: 'SUPPRIMER' }))
                                  void editor.remove(doc.key)
                              }}
                            >
                              Supprimer…
                            </MenuButton>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      {historyFor && editor.docs[historyFor] && (
        <HistoryDialog doc={editor.docs[historyFor]} onClose={() => setHistoryFor(null)} onRestore={(versionId) => editor.restore(historyFor, versionId)} />
      )}
    </>
  )
}

function MenuButton({ icon: Icon, children, onClick, danger }: { icon: typeof History; children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm', danger ? 'text-red hover:bg-red-soft' : 'text-ink-soft hover:bg-paper-sunken hover:text-ink')}
    >
      <Icon className="size-4" aria-hidden="true" />
      {children}
    </button>
  )
}
