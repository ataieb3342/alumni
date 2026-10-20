/**
 * Chargement d'un contenu de page selon le visiteur : version publiée pour
 * tout le monde, brouillon + descripteur d'édition pour un administrateur en
 * mode édition (vérifié en base, pas seulement via le jeton).
 */
import { getEditorContext } from '@/lib/auth/session'
import { getEditableContent, getPublishedContent } from '@/lib/data/content'
import { CONTENT_PAGES, type ContentKey, type ContentOf } from './definitions'
import type { DocDescriptor } from '@/app/components/edit/EditorShell'

export interface PageContent<T> {
  data: T
  editMode: boolean
  isAdmin: boolean
  doc: DocDescriptor | null
}

export async function loadPageContent<K extends ContentKey>(key: K): Promise<PageContent<ContentOf<K>>> {
  const context = await getEditorContext()
  if (!context.editMode) {
    return { data: await getPublishedContent(key), editMode: false, isAdmin: context.isAdmin, doc: null }
  }
  const editable = await getEditableContent(key)
  return {
    data: editable.data,
    editMode: true,
    isAdmin: true,
    doc: {
      key: `content:${key}`,
      label: CONTENT_PAGES[key].label,
      endpoint: `/api/admin/content/${key}`,
      data: editable.data,
      hasDraft: editable.hasDraft,
      revision: editable.updatedAt?.toISOString() ?? 'initial',
      publicUrl: CONTENT_PAGES[key].path,
    },
  }
}
