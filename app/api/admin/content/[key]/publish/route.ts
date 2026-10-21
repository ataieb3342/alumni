import { revalidatePath } from 'next/cache'
import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { CONTENT_PAGES } from '@/lib/content/definitions'
import { ContentError, publishContent } from '@/lib/data/content'
import { logActivity } from '@/lib/activity-logger'
import { contentKeyFrom } from '../route-helpers'

export const POST = apiRoute({ auth: 'admin' }, async ({ params, user }) => {
  const key = contentKeyFrom(params)
  try {
    await publishContent(key, user.id)
  } catch (error) {
    if (error instanceof ContentError) throw new HttpError(error.status, error.message)
    throw error
  }
  revalidatePath(CONTENT_PAGES[key].path)
  if (key === 'site') revalidatePath('/', 'layout')
  await logActivity({ userId: user.id, action: 'admin.content.publish', resource: key })
  return { success: true }
})
