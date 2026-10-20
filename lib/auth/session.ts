/**
 * Garde d'accès côté serveur. Les droits sont toujours relus en base : un
 * jeton de session ne suffit pas pour écrire (rôle ou statut ont pu changer).
 */
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserById, type User } from '@/lib/data/users'
import { EDIT_MODE_COOKIE } from '@/lib/edit-mode'

export class HttpError extends Error {
  constructor(public status: number, message: string, public field?: string) {
    super(message)
  }
}

export async function getSession() {
  return auth()
}

/** Compte actif correspondant à la session, ou erreur 401/403 */
export async function requireUser(): Promise<User> {
  const session = await auth()
  const id = session?.user?.id
  if (!id || id.startsWith('temp-')) throw new HttpError(401, 'Non authentifié')
  const user = await getUserById(id)
  if (!user) throw new HttpError(401, 'Non authentifié')
  if (user.accountStatus !== 'active') throw new HttpError(403, "Votre compte n'est pas actif")
  return user
}

/** Administrateur actif, ou erreur 401/403 — quelle que soit l'interface qui appelle */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser()
  if (user.role !== 'admin') throw new HttpError(403, 'Réservé aux administrateurs')
  return user
}

/** Pour les pages membres : redirige vers la connexion plutôt que de lever une erreur */
export async function requireMemberPage(callbackUrl?: string): Promise<User> {
  try {
    return await requireUser()
  } catch (error) {
    if (error instanceof HttpError && error.status === 403) redirect('/validation-en-cours')
    redirect(callbackUrl ? `/connexion?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/connexion')
  }
}

export async function requireAdminPage(): Promise<User> {
  const user = await requireMemberPage('/admin')
  if (user.role !== 'admin') redirect('/accueil')
  return user
}

export { EDIT_MODE_COOKIE }

/**
 * Contexte d'édition d'une page : l'interface d'édition et les brouillons ne
 * sont servis qu'à un administrateur (vérifié en base) qui a activé le mode.
 */
export async function getEditorContext(): Promise<{ isAdmin: boolean; editMode: boolean; user: User | null; signedIn: boolean }> {
  const session = await auth()
  // Membre connecté (compte actif) : les appels à adhérer ou à se connecter ne le concernent plus
  const signedIn = session?.user?.accountStatus === 'active' && !session.user.id?.startsWith('temp-')
  if (session?.user?.role !== 'admin' || !session.user.id) return { isAdmin: false, editMode: false, user: null, signedIn }
  const user = await getUserById(session.user.id)
  if (!user || user.role !== 'admin' || user.accountStatus !== 'active') return { isAdmin: false, editMode: false, user: null, signedIn }
  const store = await cookies()
  return { isAdmin: true, editMode: store.get(EDIT_MODE_COOKIE)?.value === '1', user, signedIn }
}
