import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { sendUserAccountValidated } from '@/lib/emails'
import crypto from 'crypto'
import { serverClient } from '@/sanity/lib/server-client'

// Fonction pour vérifier la signature du webhook (sécurité)
function verifyWebhookSignature(body: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) {
    logger.debug('[Webhook] Pas de signature fournie')
    return false
  }

  if (!process.env.SANITY_WEBHOOK_SECRET) {
    logger.warn('[Webhook] SANITY_WEBHOOK_SECRET non configuré, vérification de signature désactivée')
    return true // En développement, on peut continuer sans signature
  }

  // Parser le header de signature: "t=timestamp,v1=signature"
  const parts = signatureHeader.split(',')
  let timestamp = ''
  let signature = ''

  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key === 't') timestamp = value
    if (key === 'v1') signature = value
  }

  if (!signature || !timestamp) {
    logger.error('[Webhook] Format de signature invalide', undefined, { signatureHeader })
    return false
  }

  // Calculer la signature avec le format: timestamp.body
  const payload = `${timestamp}.${body}`
  const hash = crypto
    .createHmac('sha256', process.env.SANITY_WEBHOOK_SECRET)
    .update(payload)
    .digest('base64url')

  // Logs de debug
  logger.debug('[Webhook] Timestamp', { timestamp })
  logger.debug('[Webhook] Signature reçue', { signature: signature.substring(0, 20) + '...' })
  logger.debug('[Webhook] Signature calculée', { hash: hash.substring(0, 20) + '...' })
  logger.debug('[Webhook] Signatures égales', { match: hash === signature })

  return hash === signature
}

export async function POST(request: Request) {
  try {
    // Lire le body brut pour la vérification de signature
    const body = await request.text()

    // Logs détaillés des headers
    logger.debug('[Webhook] Requête reçue')
    logger.debug('[Webhook] Headers disponibles:')
    request.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('sanity') || key.toLowerCase().includes('signature')) {
        logger.debug(`  ${key}: ${value.substring(0, 30)}...`)
      }
    })

    const signature = request.headers.get('sanity-webhook-signature')
    logger.debug('[Webhook] Signature header', { present: signature ? 'Oui' : 'Non' })
    logger.debug('[Webhook] Body length', { length: body.length })
    logger.debug('[Webhook] Body preview', { preview: body.substring(0, 100) + '...' })

    // Vérifier la signature du webhook
    if (!verifyWebhookSignature(body, signature)) {
      logger.error('[Webhook] Signature du webhook invalide')
      logger.error('[Webhook] Secret configuré', undefined, { configured: process.env.SANITY_WEBHOOK_SECRET ? 'Oui' : 'Non' })
      return NextResponse.json(
        { error: 'Signature invalide' },
        { status: 401 }
      )
    }

    logger.debug('[Webhook] Signature valide')

    // Parser le body JSON
    const payload = JSON.parse(body)

    // Sanity envoie un objet avec _type, _id, et les champs mis à jour
    const { _type, accountStatus, firstName, lastName, email, _id, validationEmailSentAt } = payload

    // Vérifier que c'est bien un document user
    if (_type !== 'user') {
      logger.debug('[Webhook] Type de document non concerné', { _type })
      return NextResponse.json(
        { message: 'Type de document non concerné' },
        { status: 200 }
      )
    }

    logger.debug('[Webhook] Document user détecté', { firstName, lastName, accountStatus })

    // Vérifier que le statut est "active"
    if (accountStatus !== 'active') {
      logger.debug('[Webhook] Statut non actif', { accountStatus })
      return NextResponse.json(
        { message: 'Statut non actif, aucun email envoyé' },
        { status: 200 }
      )
    }

    // Vérifier si l'email de validation a déjà été envoyé
    if (validationEmailSentAt) {
      logger.debug('[Webhook] Email de validation déjà envoyé', {
        sentAt: validationEmailSentAt
      })
      return NextResponse.json(
        { message: 'Email de validation déjà envoyé' },
        { status: 200 }
      )
    }

    // Vérifier que toutes les données nécessaires sont présentes
    if (!firstName || !lastName || !email) {
      logger.error('Données utilisateur incomplètes', undefined, { firstName, lastName, email })
      return NextResponse.json(
        { error: 'Données utilisateur incomplètes' },
        { status: 400 }
      )
    }

    // Envoyer l'email de validation à l'utilisateur
    logger.debug(`[Webhook] Envoi de l'email de validation à ${email} (${firstName} ${lastName})`)
    const emailResult = await sendUserAccountValidated({
      firstName,
      lastName,
      email,
    })

    if (!emailResult.success) {
      logger.error('[Webhook] Erreur lors de l\'envoi de l\'email', emailResult.error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }

    // Mettre à jour le champ validationEmailSentAt pour éviter les doublons
    try {
      await serverClient
        .patch(_id)
        .set({ validationEmailSentAt: new Date().toISOString() })
        .commit()
      logger.debug('[Webhook] Champ validationEmailSentAt mis à jour', { _id })
    } catch (error) {
      logger.error('[Webhook] Erreur lors de la mise à jour du champ validationEmailSentAt', error)
      // On ne bloque pas le webhook même si cette mise à jour échoue
    }

    logger.debug('[Webhook] Email envoyé avec succès', { email })
    return NextResponse.json(
      {
        success: true,
        message: `Email de validation envoyé à ${email}`,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Erreur dans le webhook', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
