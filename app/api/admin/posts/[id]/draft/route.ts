import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { discardPostDraft, savePostDraft } from '@/lib/data/posts'
import { withContentErrors } from '../../errors'

export const PUT = apiRoute({ auth: 'admin' }, async ({ req, params, user }) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    throw new HttpError(400, 'Corps de requête invalide')
  }
  await withContentErrors(() => savePostDraft(params.id, body, user.id))
  return { success: true }
})

export const DELETE = apiRoute({ auth: 'admin' }, async ({ params, user }) => {
  await withContentErrors(() => discardPostDraft(params.id, user.id))
  return { success: true }
})
