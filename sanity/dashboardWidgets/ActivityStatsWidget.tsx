import { Card, Stack, Text, Flex, Heading } from '@sanity/ui'
import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'
import { useClient } from 'sanity'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

interface VisitorData {
  date: string
  visitors: number
}

interface Stats {
  totalMembers: number
  totalVisitors: number
  totalPageViews: number
  mostActiveDay: { date: string; count: number }
  returnRate: number
}

type PeriodFilter = '7days' | '14days' | '30days'

export default function ActivityStatsWidget() {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [data, setData] = useState<VisitorData[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodFilter>('7days')

  useEffect(() => {
    loadStats()
  }, [period])

  const getDateFilter = () => {
    const now = new Date()
    switch (period) {
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case '14days':
        return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  const loadStats = async () => {
    try {
      setLoading(true)
      const dateFilter = getDateFilter()

      const query = `{
        "totalMembers": count(*[_type == "user" && email != "contact@ataieb-dev.fr"]),
        "connectedVisitors": *[
          _type == "activityLog"
          && action == "page_visit"
          && timestamp >= "${dateFilter}"
          && defined(user)
          && user->email != "contact@ataieb-dev.fr"
        ] {
          "userId": user._ref,
          "timestamp": timestamp
        }
      }`

      const result = await client.fetch(query)

      // Group by day
      const dataMap: Record<string, Set<string>> = {}
      const userDaysMap: Record<string, Set<string>> = {} // Track which days each user visited

      result.connectedVisitors.forEach((visit: { userId: string; timestamp: string }) => {
        const date = new Date(visit.timestamp)
        const key = date.toISOString().split('T')[0]

        if (!dataMap[key]) {
          dataMap[key] = new Set()
        }
        dataMap[key].add(visit.userId)

        // Track user activity across days
        if (!userDaysMap[visit.userId]) {
          userDaysMap[visit.userId] = new Set()
        }
        userDaysMap[visit.userId].add(key)
      })

      // Convert to array and sort by date
      const visitorData: VisitorData[] = Object.entries(dataMap)
        .map(([date, userIds]) => ({
          date,
          visitors: userIds.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setData(visitorData)

      // Calculate stats
      const totalVisitors = new Set(
        result.connectedVisitors.map((v: { userId: string }) => v.userId)
      ).size

      const totalPageViews = result.connectedVisitors.length
      const totalMembers = result.totalMembers

      // Find most active day
      const mostActiveDay = visitorData.reduce(
        (max, day) => (day.visitors > max.count ? { date: day.date, count: day.visitors } : max),
        { date: '', count: 0 }
      )

      // Calculate return rate (users who visited on 2+ different days)
      const returningUsers = Object.values(userDaysMap).filter(days => days.size > 1).length
      const returnRate = totalVisitors > 0 ? (returningUsers / totalVisitors) * 100 : 0

      setStats({ totalMembers, totalVisitors, totalPageViews, mostActiveDay, returnRate })
    } catch (error) {
      logger.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatXAxis = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.toLocaleDateString('fr-FR', { weekday: 'short' })
    const dayNum = date.getDate()
    const month = date.toLocaleDateString('fr-FR', { month: 'short' })
    return `${day} ${dayNum} ${month}`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '12px' }}>
            {formatXAxis(label)}
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#667eea' }}>
            Visiteurs: <strong>{payload[0].value}</strong>
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card padding={4}>
        <Flex justify="center" align="center" style={{ height: 300 }}>
          <div style={{
            width: 40,
            height: 40,
            border: '4px solid #e0e7ff',
            borderTopColor: '#4f46e5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </Flex>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card padding={4} tone="caution">
        <Text>Aucune donnée disponible pour cette période</Text>
      </Card>
    )
  }

  return (
    <div style={{
      maxWidth: '100%',
      margin: '0 auto',
      padding: '16px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <Stack space={3}>
        {/* Header */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
          <div>
            <Heading size={2} style={{ color: 'white', marginBottom: '4px' }}>
              📊 Visiteurs Connectés
            </Heading>
            <Text size={0} style={{ color: 'rgba(255,255,255,0.8)' }}>
              Analyse de l&apos;activité
            </Text>
          </div>
          <Flex gap={2}>
            <button
              onClick={() => setPeriod('7days')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: period === '7days' ? 'white' : 'rgba(255,255,255,0.2)',
                color: period === '7days' ? '#667eea' : 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              7 jours
            </button>
            <button
              onClick={() => setPeriod('14days')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: period === '14days' ? 'white' : 'rgba(255,255,255,0.2)',
                color: period === '14days' ? '#667eea' : 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              14 jours
            </button>
            <button
              onClick={() => setPeriod('30days')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: period === '30days' ? 'white' : 'rgba(255,255,255,0.2)',
                color: period === '30days' ? '#667eea' : 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              30 jours
            </button>
          </Flex>
        </Flex>

        {/* KPIs */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px'
          }}>
            <Card padding={3} radius={2} shadow={1} style={{ background: 'white' }}>
              <Stack space={2}>
                <Text size={0} style={{ color: '#64748b' }}>Membres</Text>
                <Text size={4} weight="bold" style={{ color: '#667eea' }}>
                  {stats.totalMembers}
                </Text>
              </Stack>
            </Card>

            <Card padding={3} radius={2} shadow={1} style={{ background: 'white' }}>
              <Stack space={2}>
                <Text size={0} style={{ color: '#64748b' }}>Visiteurs uniques</Text>
                <Text size={4} weight="bold" style={{ color: '#667eea' }}>
                  {stats.totalVisitors}
                </Text>
              </Stack>
            </Card>

            <Card padding={3} radius={2} shadow={1} style={{ background: 'white' }}>
              <Stack space={2}>
                <Text size={0} style={{ color: '#64748b' }}>Pages vues</Text>
                <Text size={4} weight="bold" style={{ color: '#667eea' }}>
                  {stats.totalPageViews}
                </Text>
              </Stack>
            </Card>

            <Card padding={3} radius={2} shadow={1} style={{ background: 'white' }}>
              <Stack space={2}>
                <Text size={0} style={{ color: '#64748b' }}>Jour le plus actif</Text>
                <Text size={1} weight="bold" style={{ color: '#667eea' }}>
                  {formatDate(stats.mostActiveDay.date)}
                </Text>
                <Text size={0} style={{ color: '#94a3b8' }}>
                  {stats.mostActiveDay.count} visiteurs
                </Text>
              </Stack>
            </Card>

            <Card padding={3} radius={2} shadow={1} style={{ background: 'white' }}>
              <Stack space={2}>
                <Text size={0} style={{ color: '#64748b' }}>Taux de retour</Text>
                <Text size={4} weight="bold" style={{ color: '#10b981' }}>
                  {stats.returnRate.toFixed(0)}%
                </Text>
              </Stack>
            </Card>
          </div>
        )}

        {/* Chart */}
        <Card padding={4} radius={2} shadow={1} style={{ background: 'white' }}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                stroke="#64748b"
                style={{ fontSize: '11px' }}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: '11px' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="#667eea"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorVisitors)"
                dot={{ fill: '#667eea', r: 4, strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </Stack>
    </div>
  )
}
