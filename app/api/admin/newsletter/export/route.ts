import { NextResponse } from 'next/server'
import { apiRoute } from '@/lib/api'
import { buildSubscriptionsCsv } from '@/lib/data/newsletter'
import { logActivity } from '@/lib/activity-logger'

export const GET = apiRoute({ auth: 'admin' }, async ({ user }) => {
  const { csv } = await buildSubscriptionsCsv()
  await logActivity({ userId: user.id, action: 'admin.newsletter.export' })
  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="newsletters_export_${new Date().toISOString().split('T')[0]}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
})
