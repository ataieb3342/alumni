import { getDb } from '@/db'
import { activityLogs } from '@/db/schema'
import { newId } from '@/lib/ids'
import { logger } from './logger'

interface ActivityLogData {
  userId?: string
  action: string
  resource?: string
  resourceId?: string
  details?: string
  ipAddress?: string
  userAgent?: string
}

export async function logActivity(data: ActivityLogData) {
  try {
    const db = await getDb()
    await db.insert(activityLogs).values({
      id: newId(),
      userId: data.userId ?? null,
      action: data.action.slice(0, 64),
      resource: data.resource?.slice(0, 300) ?? null,
      resourceId: data.resourceId?.slice(0, 100) ?? null,
      details: data.details?.slice(0, 1000) ?? null,
      ipAddress: data.ipAddress?.slice(0, 64) ?? null,
      userAgent: data.userAgent?.slice(0, 400) ?? null,
    })
    return { success: true }
  } catch (error) {
    logger.error("Erreur lors de l'enregistrement du log d'activité", error)
    return { success: false, error }
  }
}

// Helper pour extraire l'IP de la requête
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return 'unknown'
}

// Helper pour extraire le user agent
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown'
}
