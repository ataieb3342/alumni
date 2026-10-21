import { revalidatePath } from 'next/cache'
import { apiRoute } from '@/lib/api'
import { deletePost } from '@/lib/data/posts'
import { logActivity } from '@/lib/activity-logger'
import { withContentErrors } from '../errors'

export const DELETE = apiRoute({ auth: 'admin' }, async ({ params, user }) => {
  await withContentErrors(() => deletePost(params.id, user.id))
  await logActivity({ userId: user.id, action: 'admin.post.delete', resourceId: params.id })
  revalidatePath('/blog')
  return { success: true }
})
