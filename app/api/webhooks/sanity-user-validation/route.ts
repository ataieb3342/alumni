/**
 * Webhook Sanity - Validation de compte utilisateur
 * Envoie un email lorsqu'un compte passe à 'active'
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { sendUserAccountValidated } from '@/lib/emails'
import { verifyWebhookSignature } from './security'
import { validatePayload } from './validators'
import type { SanityWebhookPayload } from './types'
import { WEBHOOK_HEADERS, HTTP_STATUS } from './constants'

/**
 * Handler POST pour le webhook de validation utilisateur
 */
export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signatureHeader = request.headers.get(WEBHOOK_HEADERS.SIGNATURE)

    // 1. Vérifier la signature du webhook (sécurité)
    const securityValidation = verifyWebhookSignature(body, signatureHeader)
    if (!securityValidation.isValid) {
      logger.warn('[Webhook] Security validation failed', { error: securityValidation.error })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // 2. Parser le payload
    const payload: SanityWebhookPayload = JSON.parse(body)

    // 3. Valider le payload métier
    const validation = validatePayload(payload)
    if (!validation.isValid) {
      logger.info('[Webhook] Payload validation skipped', {
        reason: validation.error,
        documentType: payload._type,
        status: payload.accountStatus,
      })
      return NextResponse.json(
        { message: validation.error },
        { status: HTTP_STATUS.OK }
      )
    }

    // 4. Envoyer l'email de validation
    // TypeScript sait maintenant que validation.data existe car isValid === true
    const userData = validation.data
    logger.info('[Webhook] Sending validation email', {
      email: userData.email,
      previousStatus: payload.previousAccountStatus,
      newStatus: payload.accountStatus,
    })

    const emailResult = await sendUserAccountValidated(userData)

    if (!emailResult.success) {
      logger.error('[Webhook] Email sending failed', emailResult.error)
      return NextResponse.json(
        { error: 'Email sending failed' },
        { status: HTTP_STATUS.INTERNAL_ERROR }
      )
    }

    logger.info('[Webhook] Validation email sent successfully', { email: userData.email })
    return NextResponse.json(
      {
        success: true,
        message: `Validation email sent to ${userData.email}`,
      },
      { status: HTTP_STATUS.OK }
    )
  } catch (error) {
    logger.error('[Webhook] Unexpected error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_ERROR }
    )
  }
}
