import { serverClient } from '@/sanity/lib/server-client'

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
    const logEntry = {
      _type: 'activityLog',
      action: data.action,
      timestamp: new Date().toISOString(),
      ...(data.userId && {
        user: {
          _type: 'reference',
          _ref: data.userId,
        },
      }),
      ...(data.resource && { resource: data.resource }),
      ...(data.resourceId && { resourceId: data.resourceId }),
      ...(data.details && { details: data.details }),
      ...(data.ipAddress && { ipAddress: data.ipAddress }),
      ...(data.userAgent && { userAgent: data.userAgent }),
    }

    await serverClient.create(logEntry)
    return { success: true }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du log:', error)
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
