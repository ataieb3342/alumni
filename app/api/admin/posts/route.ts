import { z } from 'zod'
import { apiRoute } from '@/lib/api'
import { createPost } from '@/lib/data/posts'
import { logActivity } from '@/lib/activity-logger'

/** Nouvel article, créé en brouillon (invisible des visiteurs) */
export const POST = apiRoute(
  { auth: 'admin', body: z.object({ title: z.string().trim().min(1, 'Donnez un titre à l’article').max(200) }) },
  async ({ body, user }) => {
    const post = await createPost(body, user.id)
    await logActivity({ userId: user.id, action: 'admin.post.create', resourceId: post.id })
    return { id: post.id, slug: post.slug }
  }
)
