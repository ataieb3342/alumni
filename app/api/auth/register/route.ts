import { NextResponse } from 'next/server'
import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { hashPassword } from '@/lib/auth/password'
import { createUser, getUserByEmail } from '@/lib/data/users'
import { sendAdminNewUserNotification } from '@/lib/emails'
import { logActivity } from '@/lib/activity-logger'
import { logger } from '@/lib/logger'
import { RateLimitPresets } from '@/lib/rate-limit'
import { registerSchema } from '@/lib/validations'

/** Inscription : compte « en attente », validé ensuite par un administrateur */
export const POST = apiRoute({ auth: 'public', body: registerSchema, rateLimit: RateLimitPresets.auth }, async ({ body }) => {
  const existing = await getUserByEmail(body.email)
  if (existing) {
    throw new HttpError(
      400,
      existing.accountStatus === 'pending'
        ? "Une demande d'inscription avec cet email est déjà en cours de validation"
        : 'Cet email est déjà utilisé',
      'email'
    )
  }
  const user = await createUser({
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    userType: body.userType,
    passwordHash: await hashPassword(body.password),
    accountStatus: 'pending',
  })
  await logActivity({ userId: user.id, action: 'signup', details: 'Inscription par email' })
  try {
    await sendAdminNewUserNotification({ firstName: user.firstName, lastName: user.lastName, email: user.email, userType: user.userType, userId: user.id })
  } catch (error) {
    logger.error("Erreur lors de l'envoi de l'email de notification admin", error)
  }
  return NextResponse.json(
    {
      message: "Votre demande d'inscription a été envoyée. Vous recevrez un email une fois votre compte validé par un administrateur.",
      userId: user.id,
    },
    { status: 201 }
  )
})
