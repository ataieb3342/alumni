/**
 * Constantes pour le webhook de validation utilisateur
 */

export const DOCUMENT_TYPE = {
  USER: 'user',
} as const

export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  INACTIVE: 'inactive',
  REJECTED: 'rejected',
} as const

export const WEBHOOK_HEADERS = {
  SIGNATURE: 'sanity-webhook-signature',
} as const

export const SIGNATURE_ALGORITHM = 'sha256'

// Fenêtre de temps acceptable pour les webhooks (5 minutes)
export const WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_ERROR: 500,
} as const
