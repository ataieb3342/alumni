import { apiRoute } from '@/lib/api'
import { listVersionsForUi } from '@/lib/data/content'

export const GET = apiRoute({ auth: 'admin' }, async ({ params }) => ({ versions: await listVersionsForUi('post', params.id) }))
