import { apiRoute } from '@/lib/api'
import { listVersionsForUi } from '@/lib/data/content'
import { contentKeyFrom } from '../route-helpers'

export const GET = apiRoute({ auth: 'admin' }, async ({ params }) => {
  return { versions: await listVersionsForUi('content', contentKeyFrom(params)) }
})
