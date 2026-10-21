import { apiRoute } from '@/lib/api'
import { restorePostVersion } from '@/lib/data/posts'
import { withContentErrors } from '../../../../errors'

export const POST = apiRoute({ auth: 'admin' }, async ({ params, user }) => {
  await withContentErrors(() => restorePostVersion(params.id, params.versionId, user.id))
  return { success: true }
})
