import { Card, Stack, Text, Box, Flex, Heading } from '@sanity/ui'
import { useEffect, useState } from 'react'
import { useClient } from 'sanity'

interface Stats {
  totalLogs: number
  totalUsers: number
  loginCount: number
  pageVisitCount: number
  uniqueActiveUsers: number
  topPages: { page: string; uniqueVisitors: number; totalVisits: number }[]
  monthlyActivity: { month: string; count: number; newUsers: number }[]
  actionBreakdown: { action: string; count: number }[]
  userGrowth: { month: string; totalUsers: number }[]
  averageVisitsPerUser: number
}

// Fonction pour normaliser les URLs
function normalizeUrl(url: string): string {
  if (!url) return url

  // Enlever les query parameters
  let normalized = url.split('?')[0]

  // Enlever les trailing slashes sauf pour la racine
  if (normalized !== '/' && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }

  // Enlever les ancres
  normalized = normalized.split('#')[0]

  return normalized
}

export default function ActivityStatsWidget() {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'6' | '12'>('12')

  useEffect(() => {
    loadStats()
  }, [period])

  const loadStats = async () => {
    try {
      const now = new Date()
      const monthsAgo = new Date(now.getTime() - parseInt(period) * 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const statsQuery = `{
        "totalLogs": count(*[_type == "activityLog"]),
        "totalUsers": count(*[_type == "user"]),
        "loginCount": count(*[_type == "activityLog" && action == "login"]),
        "pageVisitCount": count(*[_type == "activityLog" && action == "page_visit"]),
        "uniqueActiveUsers": count(array::unique(*[_type == "activityLog" && timestamp >= "${monthsAgo}T00:00:00.000Z" && defined(user)].user._ref)),
        "pageVisits": *[_type == "activityLog" && action == "page_visit" && defined(resource) && timestamp >= "${monthsAgo}T00:00:00.000Z"] {
          "page": resource,
          "userId": user._ref
        },
        "monthlyActivity": *[_type == "activityLog" && timestamp >= "${monthsAgo}T00:00:00.000Z"] {
          "timestamp": timestamp
        },
        "actionBreakdown": *[_type == "activityLog" && timestamp >= "${monthsAgo}T00:00:00.000Z"] {
          "action": action
        },
        "allUsers": *[_type == "user"] {
          "createdAt": createdAt,
          "_id": _id
        },
        "userActivity": *[_type == "activityLog" && timestamp >= "${monthsAgo}T00:00:00.000Z" && defined(user)] {
          "userId": user._ref
        }
      }`

      const data = await client.fetch(statsQuery)

      // Traiter les pages avec normalisation et comptage unique
      const pageMap: Record<string, { uniqueVisitors: Set<string>; totalVisits: number }> = {}

      data.pageVisits.forEach((visit: { page: string; userId?: string }) => {
        const normalizedPage = normalizeUrl(visit.page)

        if (!pageMap[normalizedPage]) {
          pageMap[normalizedPage] = { uniqueVisitors: new Set(), totalVisits: 0 }
        }

        pageMap[normalizedPage].totalVisits++
        if (visit.userId) {
          pageMap[normalizedPage].uniqueVisitors.add(visit.userId)
        }
      })

      const topPages = Object.entries(pageMap)
        .map(([page, data]) => ({
          page,
          uniqueVisitors: data.uniqueVisitors.size,
          totalVisits: data.totalVisits,
        }))
        .sort((a, b) => b.uniqueVisitors - a.uniqueVisitors)
        .slice(0, 10)

      // Calculer l'activité mensuelle
      const monthlyMap: Record<string, { count: number; newUsers: Set<string> }> = {}
      data.monthlyActivity.forEach((item: { timestamp: string }) => {
        const date = new Date(item.timestamp)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { count: 0, newUsers: new Set() }
        }
        monthlyMap[monthKey].count++
      })

      // Ajouter les nouveaux utilisateurs par mois
      data.allUsers.forEach((user: { createdAt: string; _id: string }) => {
        if (user.createdAt) {
          const date = new Date(user.createdAt)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          if (monthlyMap[monthKey]) {
            monthlyMap[monthKey].newUsers.add(user._id)
          }
        }
      })

      const monthlyActivity = Object.entries(monthlyMap)
        .map(([month, data]) => ({
          month,
          count: data.count,
          newUsers: data.newUsers.size,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))

      // Calculer la croissance des utilisateurs
      let cumulativeUsers = 0
      const userGrowth = monthlyActivity.map((month) => {
        cumulativeUsers += month.newUsers
        return {
          month: month.month,
          totalUsers: cumulativeUsers,
        }
      })

      // Calculer la répartition par action
      const actionMap: Record<string, number> = {}
      data.actionBreakdown.forEach((item: { action: string }) => {
        actionMap[item.action] = (actionMap[item.action] || 0) + 1
      })

      const actionBreakdown = Object.entries(actionMap)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)

      // Calculer la moyenne de visites par utilisateur
      const userVisitMap: Record<string, number> = {}
      data.userActivity.forEach((item: { userId: string }) => {
        userVisitMap[item.userId] = (userVisitMap[item.userId] || 0) + 1
      })

      const totalVisits = Object.values(userVisitMap).reduce((sum: number, count: number) => sum + count, 0)
      const averageVisitsPerUser = Object.keys(userVisitMap).length > 0
        ? totalVisits / Object.keys(userVisitMap).length
        : 0

      setStats({
        ...data,
        topPages,
        monthlyActivity,
        actionBreakdown,
        userGrowth,
        averageVisitsPerUser,
      })
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card padding={4}>
        <Flex justify="center" align="center" style={{ height: 200 }}>
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

  if (!stats) {
    return (
      <Card padding={4} tone="critical">
        <Text>❌ Erreur lors du chargement des statistiques</Text>
      </Card>
    )
  }

  const maxMonthlyCount = Math.max(...stats.monthlyActivity.map((m) => m.count), 1)
  const totalActions = stats.actionBreakdown.reduce((sum, a) => sum + a.count, 0)
  const engagementRate = stats.totalUsers > 0 ? (stats.uniqueActiveUsers / stats.totalUsers) * 100 : 0

  // Calculer la croissance sur la période
  const firstMonth = stats.monthlyActivity[0]?.count || 0
  const lastMonth = stats.monthlyActivity[stats.monthlyActivity.length - 1]?.count || 0
  const growthRate = firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0

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
        {/* En-tête */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
          <div>
            <Heading size={2} style={{ color: 'white', marginBottom: '4px' }}>
              📊 Rapport d&apos;Activité
            </Heading>
            <Text size={0} style={{ color: 'rgba(255,255,255,0.8)' }}>
              Analyse sur {period} mois
            </Text>
          </div>
          <Flex gap={2}>
            <button
              onClick={() => setPeriod('6')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: period === '6' ? 'white' : 'rgba(255,255,255,0.2)',
                color: period === '6' ? '#667eea' : 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              6 mois
            </button>
            <button
              onClick={() => setPeriod('12')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: period === '12' ? 'white' : 'rgba(255,255,255,0.2)',
                color: period === '12' ? '#667eea' : 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              12 mois
            </button>
          </Flex>
        </Flex>

        {/* KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <Text size={0} style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              Membres
            </Text>
            <Text size={4} weight="bold" style={{ color: 'white', marginTop: '8px' }}>
              {stats.totalUsers}
            </Text>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <Text size={0} style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              Actifs ({engagementRate.toFixed(0)}%)
            </Text>
            <Text size={4} weight="bold" style={{ color: 'white', marginTop: '8px' }}>
              {stats.uniqueActiveUsers}
            </Text>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <Text size={0} style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              Activités
            </Text>
            <Text size={4} weight="bold" style={{ color: 'white', marginTop: '8px' }}>
              {stats.totalLogs.toLocaleString('fr-FR')}
            </Text>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <Text size={0} style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              Connexions
            </Text>
            <Text size={4} weight="bold" style={{ color: 'white', marginTop: '8px' }}>
              {stats.loginCount}
            </Text>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <Text size={0} style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              Moy/Membre
            </Text>
            <Text size={4} weight="bold" style={{ color: 'white', marginTop: '8px' }}>
              {stats.averageVisitsPerUser.toFixed(1)}
            </Text>
          </div>
        </div>

        {/* Graphique mensuel */}
        <Card padding={3} radius={2} shadow={1} style={{ background: 'white' }}>
          <Stack space={2}>
            <Text size={1} weight="bold" style={{ color: '#1e293b' }}>
              📈 Activité mensuelle
            </Text>

            <div style={{ height: 180, position: 'relative', paddingLeft: '30px', paddingBottom: '20px' }}>
              <svg width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <g key={i}>
                    <line
                      x1="30"
                      y1={`${i * 20 + 10}%`}
                      x2="100%"
                      y2={`${i * 20 + 10}%`}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                      strokeDasharray="2"
                    />
                    <text x="5" y={`${i * 20 + 12}%`} fontSize="8" fill="#94a3b8">
                      {Math.round(maxMonthlyCount * (1 - i * 0.25))}
                    </text>
                  </g>
                ))}
              </svg>

              <svg width="calc(100% - 30px)" height="calc(100% - 20px)" style={{ position: 'absolute', left: 30, top: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#667eea" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#764ba2" stopOpacity="0.6" />
                  </linearGradient>
                </defs>

                {stats.monthlyActivity.map((month, i) => {
                  const x = (i / stats.monthlyActivity.length) * 100
                  const barWidth = 85 / stats.monthlyActivity.length
                  const height = (month.count / maxMonthlyCount) * 80
                  const y = 85 - height

                  return (
                    <rect
                      key={i}
                      x={`${x + 2}%`}
                      y={`${y}%`}
                      width={`${barWidth}%`}
                      height={`${height}%`}
                      fill="url(#barGrad)"
                      rx="2"
                    >
                      <title>{`${month.month}: ${month.count} activités`}</title>
                    </rect>
                  )
                })}
              </svg>

              <div style={{
                position: 'absolute',
                bottom: 0,
                left: '30px',
                right: 0,
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                {stats.monthlyActivity.map((month, i) => {
                  if (i % Math.max(1, Math.ceil(stats.monthlyActivity.length / 6)) !== 0) return null
                  return (
                    <Text key={i} size={0} style={{ color: '#64748b', fontSize: '9px' }}>
                      {new Date(month.month + '-01').toLocaleDateString('fr-FR', {
                        month: 'short'
                      })}
                    </Text>
                  )
                })}
              </div>
            </div>
          </Stack>
        </Card>

        {/* Ligne 2 colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Croissance */}
          <Card padding={3} radius={2} shadow={1} style={{ background: 'white' }}>
            <Stack space={2}>
              <Text size={1} weight="bold" style={{ color: '#1e293b' }}>
                👥 Croissance
              </Text>

              <div style={{ height: 140 }}>
                <svg width="100%" height="100%">
                  <defs>
                    <linearGradient id="growGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#43e97b" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#38f9d7" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  <path
                    d={`M 0 140 ${stats.userGrowth
                      .map((data, i) => {
                        const x = (i / (stats.userGrowth.length - 1)) * 100
                        const maxUsers = Math.max(...stats.userGrowth.map(g => g.totalUsers), 1)
                        const y = 140 - (data.totalUsers / maxUsers) * 120
                        return `L ${x}% ${y}`
                      })
                      .join(' ')} L 100% 140 Z`}
                    fill="url(#growGrad)"
                  />

                  <path
                    d={`M ${stats.userGrowth
                      .map((data, i) => {
                        const x = (i / (stats.userGrowth.length - 1)) * 100
                        const maxUsers = Math.max(...stats.userGrowth.map(g => g.totalUsers), 1)
                        const y = 140 - (data.totalUsers / maxUsers) * 120
                        return `${x}% ${y}`
                      })
                      .join(' L ')}`}
                    fill="none"
                    stroke="#43e97b"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <Text size={0} style={{ color: '#43e97b', textAlign: 'center' }}>
                {stats.totalUsers} membres
              </Text>
            </Stack>
          </Card>

          {/* Répartition */}
          <Card padding={3} radius={2} shadow={1} style={{ background: 'white' }}>
            <Stack space={2}>
              <Text size={1} weight="bold" style={{ color: '#1e293b' }}>
                🎯 Répartition
              </Text>

              <div style={{ display: 'flex', justifyContent: 'center', height: 120 }}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <defs>
                    {stats.actionBreakdown.map((_, i) => (
                      <linearGradient key={i} id={`grad${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={['#667eea', '#f093fb', '#4facfe'][i % 3]} />
                        <stop offset="100%" stopColor={['#764ba2', '#f5576c', '#00f2fe'][i % 3]} />
                      </linearGradient>
                    ))}
                  </defs>

                  {stats.actionBreakdown.map((action, i) => {
                    const percentage = (action.count / totalActions) * 100
                    const angle = (percentage / 100) * 360
                    const previousAngles = stats.actionBreakdown
                      .slice(0, i)
                      .reduce((sum, a) => sum + (a.count / totalActions) * 360, 0)

                    const startAngle = previousAngles - 90
                    const endAngle = startAngle + angle
                    const outerRadius = 50
                    const innerRadius = 30

                    const startOuterX = 60 + outerRadius * Math.cos((startAngle * Math.PI) / 180)
                    const startOuterY = 60 + outerRadius * Math.sin((startAngle * Math.PI) / 180)
                    const endOuterX = 60 + outerRadius * Math.cos((endAngle * Math.PI) / 180)
                    const endOuterY = 60 + outerRadius * Math.sin((endAngle * Math.PI) / 180)
                    const startInnerX = 60 + innerRadius * Math.cos((endAngle * Math.PI) / 180)
                    const startInnerY = 60 + innerRadius * Math.sin((endAngle * Math.PI) / 180)
                    const endInnerX = 60 + innerRadius * Math.cos((startAngle * Math.PI) / 180)
                    const endInnerY = 60 + innerRadius * Math.sin((startAngle * Math.PI) / 180)
                    const largeArc = angle > 180 ? 1 : 0

                    return (
                      <path
                        key={i}
                        d={`M ${startOuterX} ${startOuterY}
                            A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuterX} ${endOuterY}
                            L ${startInnerX} ${startInnerY}
                            A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${endInnerX} ${endInnerY} Z`}
                        fill={`url(#grad${i})`}
                      >
                        <title>{`${action.action}: ${percentage.toFixed(1)}%`}</title>
                      </path>
                    )
                  })}

                  <circle cx="60" cy="60" r="25" fill="white" />
                  <text x="60" y="65" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1e293b">
                    {stats.actionBreakdown.length}
                  </text>
                </svg>
              </div>

              <Stack space={1}>
                {stats.actionBreakdown.slice(0, 3).map((action, i) => (
                  <Flex key={i} justify="space-between">
                    <Text size={0}>{action.action}</Text>
                    <Text size={0} weight="bold">
                      {((action.count / totalActions) * 100).toFixed(0)}%
                    </Text>
                  </Flex>
                ))}
              </Stack>
            </Stack>
          </Card>
        </div>

        {/* Top pages */}
        <Card padding={3} radius={2} shadow={1} style={{ background: 'white' }}>
          <Stack space={2}>
            <Text size={1} weight="bold" style={{ color: '#1e293b' }}>
              🏆 Top 10 pages (visiteurs uniques)
            </Text>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '8px'
            }}>
              {stats.topPages.map((page, i) => {
                const maxCount = stats.topPages[0]?.uniqueVisitors || 1
                const percentage = (page.uniqueVisitors / maxCount) * 100

                return (
                  <div key={i}>
                    <Flex justify="space-between" style={{ marginBottom: '4px' }}>
                      <Text size={0} style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        marginRight: '8px'
                      }}>
                        {i + 1}. {page.page}
                      </Text>
                      <Text size={0} weight="bold" style={{ color: '#667eea' }}>
                        {page.uniqueVisitors}
                      </Text>
                    </Flex>
                    <div style={{
                      height: '4px',
                      background: '#f1f5f9',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: '#667eea',
                        borderRadius: '2px'
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Stack>
        </Card>
      </Stack>
    </div>
  )
}
