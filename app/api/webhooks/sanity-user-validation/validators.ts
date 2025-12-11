/**
 * Validateurs métier pour le webhook
 */

import type { SanityWebhookPayload, ValidatedUserData } from './types'
import { DOCUMENT_TYPE, ACCOUNT_STATUS } from './constants'

export interface ValidationError {
  isValid: false
  error: string
}

export interface ValidationSuccess<T = void> {
  isValid: true
  data: T
}

export type ValidationResult<T = void> = ValidationError | ValidationSuccess<T>

// Type pour les validations simples sans données
export interface SimpleValidationSuccess {
  isValid: true
}

export type SimpleValidationResult = ValidationError | SimpleValidationSuccess

/**
 * Vérifie que le document est de type 'user'
 */
export function validateDocumentType(payload: SanityWebhookPayload): SimpleValidationResult {
  if (payload._type !== DOCUMENT_TYPE.USER) {
    return {
      isValid: false,
      error: `Document type '${payload._type}' not relevant`,
    }
  }

  return { isValid: true }
}

/**
 * Vérifie que le statut a effectivement changé
 */
export function validateStatusChange(payload: SanityWebhookPayload): SimpleValidationResult {
  const { accountStatus, previousAccountStatus } = payload

  if (accountStatus === previousAccountStatus) {
    return {
      isValid: false,
      error: 'Account status unchanged',
    }
  }

  return { isValid: true }
}

/**
 * Vérifie que le nouveau statut est 'active'
 */
export function validateActiveStatus(payload: SanityWebhookPayload): SimpleValidationResult {
  if (payload.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    return {
      isValid: false,
      error: `Account status '${payload.accountStatus}' does not require notification`,
    }
  }

  return { isValid: true }
}

/**
 * Vérifie et extrait les données utilisateur requises
 */
export function validateUserData(
  payload: SanityWebhookPayload
): ValidationResult<ValidatedUserData> {
  const { firstName, lastName, email } = payload

  if (!firstName || !lastName || !email) {
    return {
      isValid: false,
      error: 'Missing required user data (firstName, lastName, or email)',
    }
  }

  return {
    isValid: true,
    data: { firstName, lastName, email },
  }
}

/**
 * Valide l'ensemble du payload
 * Retourne les données validées si tout est OK
 */
export function validatePayload(
  payload: SanityWebhookPayload
): ValidationResult<ValidatedUserData> {
  // Vérifier le type de document
  const typeValidation = validateDocumentType(payload)
  if (!typeValidation.isValid) {
    return { isValid: false, error: typeValidation.error }
  }

  // Vérifier le changement de statut
  const changeValidation = validateStatusChange(payload)
  if (!changeValidation.isValid) {
    return { isValid: false, error: changeValidation.error }
  }

  // Vérifier que le statut est 'active'
  const statusValidation = validateActiveStatus(payload)
  if (!statusValidation.isValid) {
    return { isValid: false, error: statusValidation.error }
  }

  // Vérifier et extraire les données utilisateur
  return validateUserData(payload)
}
