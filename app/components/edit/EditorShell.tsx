'use client'

/**
 * Édition sur place, côté navigateur (administrateurs uniquement).
 *
 * EditorShell est monté par le layout pour un administrateur. Chaque page
 * éditable y enregistre ses documents (EditRoot) ; les composants Editable*
 * lisent et modifient ces documents ; la barre d'admin enregistre (brouillon,
 * automatiquement après une pause de frappe), publie, annule le brouillon et
 * ouvre l'historique. Tout est revalidé côté serveur (rôle, CSRF, Zod).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/client/api'
import { getAt, setAt } from '@/lib/content/path'
import { AdminBar } from './AdminBar'

export interface DocDescriptor {
  key: string
  label: string
  /** Base des routes : `${endpoint}/draft`, `/publish`, `/versions`… */
  endpoint: string
  data: unknown
  hasDraft: boolean
  /** Article jamais publié : « Publier » le met en ligne pour la première fois */
  status?: 'published' | 'draft' | 'archived'
  publicUrl?: string
  /** Change à chaque écriture côté serveur : resynchronise l'état local */
  revision: string
  canDelete?: boolean
}

interface DocState extends DocDescriptor {
  dirty: boolean
  saving: boolean
  lastSavedAt: number | null
  error: string | null
}

interface EditorContextValue {
  editMode: boolean
  setEditMode: (value: boolean) => void
  docs: Record<string, DocState>
  register: (docs: DocDescriptor[]) => () => void
  getValue: (docKey: string, path: string) => unknown
  setValue: (docKey: string, path: string, value: unknown) => void
  /** Modification de structure (ajout, suppression, ordre, image) : enregistrée puis page re-rendue */
  commit: (docKey: string, mutate: (data: unknown) => unknown) => Promise<void>
  save: (docKey?: string) => Promise<boolean>
  publish: (docKey: string) => Promise<void>
  discard: (docKey: string) => Promise<void>
  unpublish: (docKey: string) => Promise<void>
  remove: (docKey: string) => Promise<void>
  restore: (docKey: string, versionId: string) => Promise<void>
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function useEditor() {
  return useContext(EditorContext)
}

const AUTOSAVE_DELAY = 1500

export function EditorShell({ initialEditMode, children }: { initialEditMode: boolean; children: ReactNode }) {
  const router = useRouter()
  const [editMode, setEditModeState] = useState(initialEditMode)
  const [docs, setDocs] = useState<Record<string, DocState>>({})
  const docsRef = useRef(docs)
  useEffect(() => {
    docsRef.current = docs
  }, [docs])
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const setEditMode = useCallback(
    (value: boolean) => {
      document.cookie = `edit_mode=${value ? '1' : '0'}; path=/; samesite=strict${location.protocol === 'https:' ? '; secure' : ''}`
      setEditModeState(value)
      router.refresh()
    },
    [router]
  )

  const register = useCallback((descriptors: DocDescriptor[]) => {
    setDocs((current) => {
      const next = { ...current }
      for (const descriptor of descriptors) {
        const existing = current[descriptor.key]
        // Pas d'écrasement d'une saisie en cours par un rendu serveur plus ancien
        if (existing?.dirty && existing.revision === descriptor.revision) continue
        next[descriptor.key] = {
          ...descriptor,
          dirty: false,
          saving: false,
          lastSavedAt: existing?.lastSavedAt ?? null,
          error: null,
        }
      }
      return next
    })
    return () => {
      setDocs((current) => {
        const next = { ...current }
        for (const descriptor of descriptors) if (!next[descriptor.key]?.dirty) delete next[descriptor.key]
        return next
      })
    }
  }, [])

  const patchDoc = (key: string, patch: Partial<DocState>) =>
    setDocs((current) => (current[key] ? { ...current, [key]: { ...current[key], ...patch } } : current))

  const save = useCallback(async (docKey?: string): Promise<boolean> => {
    const keys = docKey ? [docKey] : Object.keys(docsRef.current).filter((key) => docsRef.current[key].dirty)
    let ok = true
    for (const key of keys) {
      const doc = docsRef.current[key]
      if (!doc) continue
      clearTimeout(timers.current[key])
      patchDoc(key, { saving: true, error: null })
      try {
        await api(`${doc.endpoint}/draft`, { method: 'PUT', body: doc.data })
        // Une saisie a pu arriver pendant l'enregistrement : on ne la marque pas comme enregistrée
        setDocs((current) => {
          const latest = current[key]
          if (!latest) return current
          const unchanged = latest.data === doc.data
          return { ...current, [key]: { ...latest, saving: false, hasDraft: true, dirty: !unchanged, lastSavedAt: Date.now(), error: null } }
        })
      } catch (error) {
        ok = false
        const message = error instanceof ApiError ? error.message : 'Enregistrement impossible'
        patchDoc(key, { saving: false, error: message })
        toast.error(`Brouillon non enregistré : ${message}`)
      }
    }
    return ok
  }, [])

  const scheduleSave = useCallback(
    (key: string) => {
      clearTimeout(timers.current[key])
      timers.current[key] = setTimeout(() => void save(key), AUTOSAVE_DELAY)
    },
    [save]
  )

  const setValue = useCallback(
    (docKey: string, path: string, value: unknown) => {
      setDocs((current) => {
        const doc = current[docKey]
        if (!doc) return current
        return { ...current, [docKey]: { ...doc, data: setAt(doc.data, path, value), dirty: true } }
      })
      scheduleSave(docKey)
    },
    [scheduleSave]
  )

  const getValue = useCallback((docKey: string, path: string) => getAt(docsRef.current[docKey]?.data, path), [])

  const commit = useCallback(
    async (docKey: string, mutate: (data: unknown) => unknown) => {
      const doc = docsRef.current[docKey]
      if (!doc) return
      const data = mutate(doc.data)
      docsRef.current = { ...docsRef.current, [docKey]: { ...doc, data, dirty: true } }
      setDocs(docsRef.current)
      if (await save(docKey)) router.refresh()
    },
    [save, router]
  )

  const publish = useCallback(
    async (docKey: string) => {
      const doc = docsRef.current[docKey]
      if (!doc) return
      if (doc.dirty && !(await save(docKey))) return
      try {
        await api(`${doc.endpoint}/publish`, { method: 'POST' })
        patchDoc(docKey, { hasDraft: false, dirty: false, status: 'published' })
        toast.success(`${doc.label} : publié. Les visiteurs voient maintenant cette version.`)
        router.refresh()
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'Publication impossible')
      }
    },
    [save, router]
  )

  const discard = useCallback(
    async (docKey: string) => {
      const doc = docsRef.current[docKey]
      if (!doc) return
      clearTimeout(timers.current[docKey])
      try {
        await api(`${doc.endpoint}/draft`, { method: 'DELETE' })
        patchDoc(docKey, { dirty: false, hasDraft: false })
        toast.success('Brouillon abandonné : retour à la version publiée')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'Action impossible')
      }
    },
    [router]
  )

  const unpublish = useCallback(
    async (docKey: string) => {
      const doc = docsRef.current[docKey]
      if (!doc) return
      try {
        await api(`${doc.endpoint}/unpublish`, { method: 'POST' })
        patchDoc(docKey, { status: 'draft', hasDraft: true })
        toast.success('Article retiré du site : il reste disponible en brouillon')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'Action impossible')
      }
    },
    [router]
  )

  const remove = useCallback(
    async (docKey: string) => {
      const doc = docsRef.current[docKey]
      if (!doc) return
      try {
        await api(doc.endpoint, { method: 'DELETE' })
        toast.success(`${doc.label} supprimé`)
        setDocs((current) => {
          const next = { ...current }
          delete next[docKey]
          return next
        })
        router.push('/blog')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'Suppression impossible')
      }
    },
    [router]
  )

  const restore = useCallback(
    async (docKey: string, versionId: string) => {
      const doc = docsRef.current[docKey]
      if (!doc) return
      try {
        await api(`${doc.endpoint}/versions/${versionId}/restore`, { method: 'POST' })
        patchDoc(docKey, { dirty: false, hasDraft: true })
        toast.success('Version restaurée dans le brouillon. Publiez pour la mettre en ligne.')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof ApiError ? error.message : 'Restauration impossible')
      }
    },
    [router]
  )

  // Avertir avant de quitter une page avec des modifications non enregistrées
  const anyDirty = Object.values(docs).some((doc) => doc.dirty || doc.saving)
  useEffect(() => {
    if (!anyDirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [anyDirty])

  // Ctrl/Cmd + S : enregistrer le brouillon
  useEffect(() => {
    if (!editMode) return
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editMode, save])

  const value = useMemo<EditorContextValue>(
    () => ({ editMode, setEditMode, docs, register, getValue, setValue, commit, save, publish, discard, unpublish, remove, restore }),
    [editMode, setEditMode, docs, register, getValue, setValue, commit, save, publish, discard, unpublish, remove, restore]
  )

  return (
    <EditorContext.Provider value={value}>
      {children}
      <AdminBar />
    </EditorContext.Provider>
  )
}

/** Enregistre les documents éditables de la page courante */
export function EditRoot({ docs, children }: { docs: DocDescriptor[]; children: ReactNode }) {
  const editor = useEditor()
  const register = editor?.register
  const signature = docs.map((doc) => `${doc.key}@${doc.revision}`).join('|')
  useEffect(() => {
    if (!register) return
    return register(docs)
    // La signature (clés + révisions) suffit à détecter un nouveau rendu serveur
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, signature])
  return <>{children}</>
}

/** Valeur courante d'un champ (état local en cours d'édition, sinon valeur rendue par le serveur) */
export function useFieldValue<T>(docKey: string, path: string, fallback: T): [T, (value: T) => void] {
  const editor = useEditor()
  const doc = editor?.docs[docKey]
  const value = doc ? (getAt(doc.data, path) as T | undefined) : undefined
  const set = useCallback((next: T) => editor?.setValue(docKey, path, next), [editor, docKey, path])
  return [value === undefined ? fallback : value, set]
}
