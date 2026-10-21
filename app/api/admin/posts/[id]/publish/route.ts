import { revalidatePath } from 'next/cache'
import { apiRoute } from '@/lib/api'
import { publishPost } from '@/lib/data/posts'
import { logActivity } from '@/lib/activity-logger'
import { withContentErrors } from '../../errors'

export const POST = apiRoute({ auth: 'admin' }, async ({ params, user }) => {
  const content = await withContentErrors(() => publishPost(params.id, user.id))
  await logActivity({ userId: user.id, action: 'admin.post.publish', resourceId: params.id })
  revalidatePath('/blog')
  revalidatePath(`/blog/${content.slug}`)
  return { success: true, slug: content.slug }
})
