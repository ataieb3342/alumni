import { revalidatePath } from 'next/cache'
import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { CONTENT_PAGES } from '@/lib/content/definitions'
import { ContentError, discardContentDraft, saveContentDraft } from '@/lib/data/content'
import { contentKeyFrom } from '../route-helpers'

/** Enregistre le brouillon (validé et assaini côté serveur) */
export const PUT = apiRoute({ auth: 'admin' }, async ({ req, params, user }) => {
  const key = contentKeyFrom(params)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    throw new HttpError(400, 'Corps de requête invalide')
  }
  try {
    await saveContentDraft(key, body, user.id)
  } catch (error) {
    if (error instanceof ContentError) throw new HttpError(error.status, error.message)
    throw error
  }
  return { success: true }
})

/** Abandonne le brouillon : retour à la version publiée */
export const DELETE = apiRoute({ auth: 'admin' }, async ({ params, user }) => {
  const key = contentKeyFrom(params)
  await discardContentDraft(key, user.id)
  revalidatePath(CONTENT_PAGES[key].path)
  return { success: true }
})
