import { z } from 'zod'
import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { errorResponse } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { createUser, getUserByEmail, getUserById, updateUser } from '@/lib/data/users'
import { sendAdminNewUserNotification } from '@/lib/emails'
import { logActivity } from '@/lib/activity-logger'
import { logger } from '@/lib/logger'
import { verifyCsrf } from '@/lib/security/csrf'

const schema = z.object({
  userType: z.enum(['lyceen', 'bts', 'prepa', 'alumni', 'staff'], { message: "Type d'utilisateur invalide" }),
})

/**
 * Première connexion OAuth : crée le compte (en attente de validation) après
 * le choix du type de membre. La session porte encore un identifiant temporaire.
 */
export async function POST(request: NextRequest) {
  try {
    if (!verifyCsrf(request).ok) throw new HttpError(403, 'Requête refusée (protection CSRF)')
    const session = await auth()
    if (!session?.user?.id) throw new HttpError(401, 'Non authentifié')
    const { userType } = schema.parse(await request.json())

    if (session.user.id.startsWith('temp-')) {
      const email = session.user.email?.toLowerCase()
      if (!email) throw new HttpError(400, 'Email manquant')
      if (await getUserByEmail(email)) throw new HttpError(400, 'Un utilisateur avec cet email existe déjà')
      const user = await createUser({
        email,
        firstName: session.user.firstName || '',
        lastName: session.user.lastName || '',
        userType,
        accountStatus: 'pending',
        oauthProvider: session.user.provider,
        oauthId: session.user.id.replace('temp-', ''),
        linkedIn: session.user.provider === 'linkedin' ? session.user.linkedInUrl || null : null,
      })
      await logActivity({ userId: user.id, action: 'signup', details: `Inscription via ${session.user.provider}` })
      try {
        await sendAdminNewUserNotification({ firstName: user.firstName, lastName: user.lastName, email, userType, userId: user.id })
      } catch (error) {
        logger.error("Erreur lors de l'envoi de l'email admin", error)
      }
      return NextResponse.json({ message: 'Utilisateur créé avec succès', userType, userId: user.id })
    }

    const user = await getUserById(session.user.id)
    if (!user) throw new HttpError(404, 'Utilisateur non trouvé')
    await updateUser(user.id, { userType, isVisibleInDirectory: userType !== 'lyceen' })
    return NextResponse.json({ message: "Type d'utilisateur mis à jour avec succès", userType })
  } catch (error) {
    return errorResponse(error)
  }
}
