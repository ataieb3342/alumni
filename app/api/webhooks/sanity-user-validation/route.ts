import { NextResponse } from 'next/server'
import { sendAccountValidatedEmail } from '@/lib/email'
import crypto from 'crypto'

// Fonction pour vérifier la signature du webhook (sécurité)
function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature) return false
  if (!process.env.SANITY_WEBHOOK_SECRET) {
    console.warn('SANITY_WEBHOOK_SECRET non configuré, vérification de signature désactivée')
    return true // En développement, on peut continuer sans signature
  }

  const hash = crypto
    .createHmac('sha256', process.env.SANITY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex')

  return hash === signature
}

export async function POST(request: Request) {
  try {
    // Lire le body brut pour la vérification de signature
    const body = await request.text()
    const signature = request.headers.get('sanity-webhook-signature')

    // Vérifier la signature du webhook
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Signature du webhook invalide')
      return NextResponse.json(
        { error: 'Signature invalide' },
        { status: 401 }
      )
    }

    // Parser le body JSON
    const payload = JSON.parse(body)

    // Sanity envoie un objet avec _type, _id, et les champs mis à jour
    const { _type, accountStatus, firstName, lastName, email, _id } = payload

    // Vérifier que c'est bien un document user
    if (_type !== 'user') {
      return NextResponse.json(
        { message: 'Type de document non concerné' },
        { status: 200 }
      )
    }

    // Vérifier que le statut est "active"
    if (accountStatus !== 'active') {
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
    console.log(`Envoi de l'email de validation à ${email} (${firstName} ${lastName})`)
    const emailResult = await sendAccountValidatedEmail({
      firstName,
      lastName,
      email,
    })

    if (!emailResult.success) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailResult.error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }

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
