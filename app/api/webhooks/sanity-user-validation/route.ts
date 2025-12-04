import { NextResponse } from 'next/server'
import { sendAccountValidatedEmail } from '@/lib/email'
import crypto from 'crypto'

// Fonction pour vérifier la signature du webhook (sécurité)
function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature) {
    console.log('[Webhook] Pas de signature fournie')
    return false
  }

  if (!process.env.SANITY_WEBHOOK_SECRET) {
    console.warn('[Webhook] SANITY_WEBHOOK_SECRET non configuré, vérification de signature désactivée')
    return true // En développement, on peut continuer sans signature
  }

  const hash = crypto
    .createHmac('sha256', process.env.SANITY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')

  // Logs de debug
  console.log('[Webhook] Signature reçue:', signature.substring(0, 20) + '...')
  console.log('[Webhook] Signature calculée:', hash.substring(0, 20) + '...')
  console.log('[Webhook] Signatures égales:', hash === signature)

  return hash === signature
}

export async function POST(request: Request) {
  try {
    // Lire le body brut pour la vérification de signature
    const body = await request.text()

    // Logs détaillés des headers
    console.log('[Webhook] Requête reçue')
    console.log('[Webhook] Headers disponibles:')
    request.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('sanity') || key.toLowerCase().includes('signature')) {
        console.log(`  ${key}: ${value.substring(0, 30)}...`)
      }
    })

    const signature = request.headers.get('x-sanity-signature')
    console.log('[Webhook] Signature header (x-sanity-signature):', signature ? 'Présent' : 'Absent')
    console.log('[Webhook] Body length:', body.length)
    console.log('[Webhook] Body preview:', body.substring(0, 100) + '...')

    // Vérifier la signature du webhook
    if (!verifyWebhookSignature(body, signature)) {
      console.error('[Webhook] Signature du webhook invalide')
      console.error('[Webhook] Secret configuré:', process.env.SANITY_WEBHOOK_SECRET ? 'Oui' : 'Non')
      return NextResponse.json(
        { error: 'Signature invalide' },
        { status: 401 }
      )
    }

    console.log('[Webhook] Signature valide')

    // Parser le body JSON
    const payload = JSON.parse(body)

    // Sanity envoie un objet avec _type, _id, et les champs mis à jour
    const { _type, accountStatus, firstName, lastName, email, _id } = payload

    // Vérifier que c'est bien un document user
    if (_type !== 'user') {
      console.log('[Webhook] Type de document non concerné:', _type)
      return NextResponse.json(
        { message: 'Type de document non concerné' },
        { status: 200 }
      )
    }

    console.log('[Webhook] Document user détecté:', { firstName, lastName, accountStatus })

    // Vérifier que le statut est "active"
    if (accountStatus !== 'active') {
      console.log('[Webhook] Statut non actif:', accountStatus)
      return NextResponse.json(
        { message: 'Statut non actif, aucun email envoyé' },
        { status: 200 }
      )
    }

    // Vérifier que toutes les données nécessaires sont présentes
    if (!firstName || !lastName || !email) {
      console.error('Données utilisateur incomplètes:', { firstName, lastName, email })
      return NextResponse.json(
        { error: 'Données utilisateur incomplètes' },
        { status: 400 }
      )
    }

    // Envoyer l'email de validation à l'utilisateur
    console.log(`[Webhook] Envoi de l'email de validation à ${email} (${firstName} ${lastName})`)
    const emailResult = await sendAccountValidatedEmail({
      firstName,
      lastName,
      email,
    })

    if (!emailResult.success) {
      console.error('[Webhook] Erreur lors de l\'envoi de l\'email:', emailResult.error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }

    console.log('[Webhook] Email envoyé avec succès à', email)
    return NextResponse.json(
      {
        success: true,
        message: `Email de validation envoyé à ${email}`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur dans le webhook:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
