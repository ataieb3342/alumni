import { z } from 'zod'
import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { deleteMedia, MediaError, updateMediaAlt } from '@/lib/data/media'
import { logActivity } from '@/lib/activity-logger'

export const PATCH = apiRoute({ auth: 'admin', body: z.object({ alt: z.string().trim().max(300) }) }, async ({ params, body }) => {
  const item = await updateMediaAlt(params.id, body.alt)
  if (!item) throw new HttpError(404, 'Média introuvable')
  return { media: item }
})

export const DELETE = apiRoute({ auth: 'admin' }, async ({ params, user }) => {
  try {
    await deleteMedia(params.id)
  } catch (error) {
    if (error instanceof MediaError) throw new HttpError(error.status, error.message)
    throw error
  }
  await logActivity({ userId: user.id, action: 'admin.media.delete', resourceId: params.id })
  return { success: true }
})
