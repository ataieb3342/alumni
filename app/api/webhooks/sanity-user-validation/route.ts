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
    const { _type, accountStatus, firstName, lastName, email, _id } = payload

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

    // Vérifier l'historique des révisions pour savoir si le statut vient de changer
    try {
      // Récupérer l'historique des révisions du document
      const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
      const history = await serverClient.request({
        url: `/data/history/${dataset}/documents/${_id}`,
        method: 'GET',
      })

      logger.debug('[Webhook] Historique récupéré - Structure complète:', {
        hasTransactions: !!history?.transactions,
        transactionsCount: history?.transactions?.length || 0,
        historyKeys: history ? Object.keys(history) : [],
        firstTransactionKeys: history?.transactions?.[0] ? Object.keys(history.transactions[0]) : [],
      })

      // Log des 2 premières transactions pour debug
      if (history?.transactions && history.transactions.length >= 1) {
        logger.debug('[Webhook] Transaction 0 (latest)', {
          transaction: JSON.stringify(history.transactions[0], null, 2)
        })
      }
      if (history?.transactions && history.transactions.length >= 2) {
        logger.debug('[Webhook] Transaction 1 (previous)', {
          transaction: JSON.stringify(history.transactions[1], null, 2)
        })
      }

      // Comparer les 2 dernières révisions
      if (history?.transactions && history.transactions.length >= 2) {
        const latestTransaction = history.transactions[0]
        const previousTransaction = history.transactions[1]

        const currentStatus = latestTransaction?.document?.accountStatus
        const previousStatus = previousTransaction?.document?.accountStatus

        logger.debug('[Webhook] Comparaison des statuts', {
          currentStatus,
          previousStatus,
          hasCurrentStatus: !!currentStatus,
          hasPreviousStatus: !!previousStatus,
        })

        // Si le statut n'a pas changé, ne pas envoyer l'email
        if (currentStatus === previousStatus && currentStatus === 'active') {
          logger.debug('[Webhook] Le statut n\'a pas changé (déjà active), aucun email envoyé')
          return NextResponse.json(
            { message: 'Le statut n\'a pas changé, aucun email envoyé' },
            { status: 200 }
          )
        }

        // Si le statut précédent n'était pas 'active' et le nouveau est 'active', c'est une validation
        if (previousStatus !== 'active' && currentStatus === 'active') {
          logger.debug('[Webhook] Changement de statut détecté : validation du compte')
          // On continue pour envoyer l'email
        } else {
          // Cas où on ne peut pas déterminer le changement
          logger.warn('[Webhook] Impossible de déterminer si le statut a changé, on bloque l\'envoi par sécurité', {
            currentStatus,
            previousStatus
          })
          return NextResponse.json(
            { message: 'Impossible de vérifier le changement de statut' },
            { status: 200 }
          )
        }
      } else {
        logger.warn('[Webhook] Pas assez de transactions dans l\'historique', {
          count: history?.transactions?.length || 0
        })
      }
    } catch (error) {
      logger.error('[Webhook] Erreur lors de la vérification de l\'historique', error)
      // Bloquer l'envoi en cas d'erreur pour éviter les doublons
      return NextResponse.json(
        { error: 'Erreur lors de la vérification de l\'historique' },
        { status: 500 }
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
