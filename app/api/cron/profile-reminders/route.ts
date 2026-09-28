import { NextRequest, NextResponse } from 'next/server'
import { groq } from 'next-sanity'
import { serverClient } from '@/sanity/lib/server-client'
import { sendUserProfileReminder } from '@/lib/emails'
import { logger } from '@/lib/logger'

// Un mois après l'inscription, un rappel unique aux membres dont le profil
// d'annuaire est resté vide : ni formation, ni expérience, ni fonction au
// lycée, ni classe actuelle.
const DELAY_DAYS = 30

// Reste loin des limites d'envoi SMTP ; le reliquat part au passage suivant
const BATCH_SIZE = 40

const ELIGIBLE = groq`
  _type == "user" &&
  accountStatus == "active" &&
  userType in ["alumni", "bts", "prepa", "staff"] &&
  isVisibleInDirectory != false &&
  !defined(profileReminderSentAt) &&
  dateTime(coalesce(createdAt, _createdAt)) < dateTime(now()) - $delaySeconds &&
  coalesce(count(education), 0) == 0 &&
  coalesce(count(experience), 0) == 0 &&
  (!defined(staffDetails) || staffDetails == "") &&
  (!defined(currentStudies) || currentStudies == "")
`

interface Member {
  _id: string
  firstName: string
  email: string
}

export async function GET(request: NextRequest) {
  // Vérifier l'autorisation via le secret Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const params = { delaySeconds: DELAY_DAYS * 24 * 60 * 60, limit: BATCH_SIZE }

  try {
    // ?dryRun=1 : combien de membres recevraient le rappel, sans rien envoyer
    if (request.nextUrl.searchParams.get('dryRun') === '1') {
      const eligible = await serverClient.fetch<number>(`count(*[${ELIGIBLE}])`, params)
      return NextResponse.json({ dryRun: true, eligible, batchSize: BATCH_SIZE })
    }

    const members = await serverClient.fetch<Member[]>(
      `*[${ELIGIBLE}] | order(coalesce(createdAt, _createdAt) asc) [0...$limit] { _id, firstName, email }`,
      params
    )

    let sent = 0
    let failed = 0
    for (const member of members) {
      const result = await sendUserProfileReminder({ firstName: member.firstName, email: member.email })
      if (!result.success) {
        failed++
        continue
      }
      // Marqué seulement après un envoi réussi : un échec est retenté au passage suivant
      await serverClient.patch(member._id).set({ profileReminderSentAt: new Date().toISOString() }).commit()
      sent++
    }

    logger.info('Rappels de profil envoyés', { sent, failed })
    return NextResponse.json({ sent, failed })
  } catch (error) {
    logger.error('Erreur lors de l\'envoi des rappels de profil:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'envoi des rappels' }, { status: 500 })
  }
}
