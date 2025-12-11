/**
 * Gestion de la sécurité du webhook (signature et replay protection)
 */

import * as crypto from 'crypto'
import { logger } from '@/lib/logger'
import type { WebhookSignatureParts, WebhookValidationResult } from './types'
import { SIGNATURE_ALGORITHM, WEBHOOK_TIMESTAMP_TOLERANCE_MS } from './constants'

/**
 * Parse le header de signature Sanity
 * Format: "t=timestamp,v1=signature"
 */
function parseSignatureHeader(signatureHeader: string): WebhookSignatureParts | null {
  const parts = signatureHeader.split(',')
  let timestamp = ''
  let signature = ''

  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key === 't') timestamp = value
    if (key === 'v1') signature = value
  }

  if (!signature || !timestamp) {
    return null
  }

  return { timestamp, signature }
}

/**
 * Calcule la signature HMAC du payload
 */
function calculateSignature(timestamp: string, body: string, secret: string): string {
  const payload = `${timestamp}.${body}`
  return crypto
    .createHmac(SIGNATURE_ALGORITHM, secret)
    .update(payload)
    .digest('base64url')
}

/**
 * Compare deux signatures de manière sécurisée (protection timing attack)
 */
function compareSignatures(signature1: string, signature2: string): boolean {
  try {
    const buf1 = Buffer.from(signature1)
    const buf2 = Buffer.from(signature2)

    // Les buffers doivent avoir la même longueur pour timingSafeEqual
    if (buf1.length !== buf2.length) {
      return false
    }

    return crypto.timingSafeEqual(buf1, buf2)
  } catch {
    return false
  }
}

/**
 * Vérifie que le timestamp n'est pas trop ancien (protection replay attack)
 */
function isTimestampValid(timestamp: string): boolean {
  const timestampMs = parseInt(timestamp, 10) * 1000
  const now = Date.now()
  const age = now - timestampMs

  return age >= 0 && age <= WEBHOOK_TIMESTAMP_TOLERANCE_MS
}

/**
 * Vérifie la signature du webhook Sanity
 */
export function verifyWebhookSignature(
  body: string,
  signatureHeader: string | null
): WebhookValidationResult {
  // Vérifier la présence du header
  if (!signatureHeader) {
    logger.warn('[Webhook Security] Signature header missing')
    return { isValid: false, error: 'Signature header missing' }
  }

  // Vérifier la présence du secret
  const secret = process.env.SANITY_WEBHOOK_SECRET
  if (!secret) {
    logger.error('[Webhook Security] SANITY_WEBHOOK_SECRET not configured')
    return { isValid: false, error: 'Webhook secret not configured' }
  }

  // Parser le header
  const parts = parseSignatureHeader(signatureHeader)
  if (!parts) {
    logger.warn('[Webhook Security] Invalid signature format')
    return { isValid: false, error: 'Invalid signature format' }
  }

  // Vérifier le timestamp (protection replay attack)
  if (!isTimestampValid(parts.timestamp)) {
    logger.warn('[Webhook Security] Timestamp too old or invalid', {
      timestamp: parts.timestamp,
    })
    return { isValid: false, error: 'Timestamp too old or invalid' }
  }

  // Calculer et comparer les signatures
  const expectedSignature = calculateSignature(parts.timestamp, body, secret)
  const isValid = compareSignatures(parts.signature, expectedSignature)

  if (!isValid) {
    logger.warn('[Webhook Security] Signature mismatch')
  }

  return { isValid }
}
