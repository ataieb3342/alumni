/**
 * Types pour le webhook de validation utilisateur Sanity
 */

export type AccountStatus = 'pending' | 'active' | 'inactive' | 'rejected'

export interface SanityWebhookPayload {
  _type: string
  _id: string
  accountStatus?: AccountStatus
  previousAccountStatus?: AccountStatus
  firstName?: string
  lastName?: string
  email?: string
}

export interface ValidatedUserData {
  firstName: string
  lastName: string
  email: string
}

export interface WebhookSignatureParts {
  timestamp: string
  signature: string
}

export interface WebhookValidationResult {
  isValid: boolean
  error?: string
}
