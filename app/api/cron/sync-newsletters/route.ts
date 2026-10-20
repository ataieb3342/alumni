import { NextRequest, NextResponse } from 'next/server'
import { driveConfigured, syncSubscriptionsToDrive } from '@/lib/drive-export'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  if (!driveConfigured()) {
    return NextResponse.json({ error: 'Configuration Google Drive manquante' }, { status: 500 })
  }
  try {
    const result = await syncSubscriptionsToDrive()
    return NextResponse.json({ success: true, message: 'Export synchronisé avec Google Drive', ...result, timestamp: new Date().toISOString() })
  } catch (error) {
    logger.error('Erreur lors de la synchronisation cron:', error)
    return NextResponse.json({ error: 'Erreur lors de la synchronisation', timestamp: new Date().toISOString() }, { status: 500 })
  }
}
