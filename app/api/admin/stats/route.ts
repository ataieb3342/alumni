import { apiRoute } from '@/lib/api'
import { getOverviewCounts, getVisitStats } from '@/lib/data/stats'

export const GET = apiRoute({ auth: 'admin' }, async ({ req }) => {
  const period = Number(new URL(req.url).searchParams.get('period') ?? 7)
  const days = period === 30 ? 30 : period === 14 ? 14 : 7
  const [overview, visits] = await Promise.all([getOverviewCounts(), getVisitStats(days)])
  return { overview, visits }
})
