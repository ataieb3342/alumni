import { revalidatePath } from 'next/cache'
import { apiRoute } from '@/lib/api'
import { unpublishPost } from '@/lib/data/posts'
import { logActivity } from '@/lib/activity-logger'
import { withContentErrors } from '../../errors'

export const POST = apiRoute({ auth: 'admin' }, async ({ params, user }) => {
  await withContentErrors(() => unpublishPost(params.id, user.id))
  await logActivity({ userId: user.id, action: 'admin.post.unpublish', resourceId: params.id })
  revalidatePath('/blog')
  return { success: true }
})
