import { NextRequest, NextResponse } from 'next/server'
import { countProfileReminderCandidates, listProfileReminderCandidates, updateUser } from '@/lib/data/users'
import { sendUserProfileReminder } from '@/lib/emails'
import { logger } from '@/lib/logger'

// Un mois après l'inscription, un rappel unique aux membres dont le profil
// d'annuaire est resté vide : ni formation, ni expérience, ni fonction au
// lycée, ni classe actuelle.
const DELAY_DAYS = 30

// Reste loin des limites d'envoi SMTP ; le reliquat part au passage suivant
const BATCH_SIZE = 40

export async function GET(request: NextRequest) {
  // Vérifier l'autorisation via le secret Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    // ?dryRun=1 : combien de membres recevraient le rappel, sans rien envoyer
    if (request.nextUrl.searchParams.get('dryRun') === '1') {
      const eligible = await countProfileReminderCandidates(DELAY_DAYS)
      return NextResponse.json({ dryRun: true, eligible, batchSize: BATCH_SIZE })
    }

    const members = await listProfileReminderCandidates(DELAY_DAYS, BATCH_SIZE)
    let sent = 0
    let failed = 0
    for (const member of members) {
      const result = await sendUserProfileReminder({ firstName: member.firstName, email: member.email })
      if (!result.success) {
        failed++
        continue
      }
      // Marqué seulement après un envoi réussi : un échec est retenté au passage suivant
      await updateUser(member.id, { profileReminderSentAt: new Date() })
      sent++
    }

    logger.info('Rappels de profil envoyés', { sent, failed })
    return NextResponse.json({ sent, failed })
  } catch (error) {
    logger.error("Erreur lors de l'envoi des rappels de profil:", error)
    return NextResponse.json({ error: "Erreur lors de l'envoi des rappels" }, { status: 500 })
  }
}
