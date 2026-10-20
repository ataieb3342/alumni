import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { ContentError, restoreContentVersion } from '@/lib/data/content'
import { contentKeyFrom } from '../../../route-helpers'

export const POST = apiRoute({ auth: 'admin' }, async ({ params, user }) => {
  try {
    await restoreContentVersion(contentKeyFrom(params), params.versionId, user.id)
  } catch (error) {
    if (error instanceof ContentError) throw new HttpError(error.status, error.message)
    throw error
  }
  return { success: true }
})
