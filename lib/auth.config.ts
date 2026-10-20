/**
 * Configuration NextAuth commune, sans accès à la base : utilisable dans le
 * proxy (middleware). Les fournisseurs et les callbacks qui lisent la base
 * sont ajoutés dans lib/auth.ts.
 */
import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: { signIn: '/connexion' },
  session: { strategy: 'jwt' },
  trustHost: true,
  providers: [],
  callbacks: {
    // Le jeton porte déjà tout ce qu'il faut : aucune requête par page vue
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id
        session.user.userType = token.userType ?? ''
        session.user.role = token.role ?? 'member'
        session.user.accountStatus = token.accountStatus ?? ''
        session.user.isNewUser = token.isNewUser ?? false
        session.user.provider = token.provider ?? ''
        session.user.needsTypeSelection = token.needsTypeSelection ?? false
        session.user.firstName = token.firstName ?? ''
        session.user.lastName = token.lastName ?? ''
        session.user.name = `${token.firstName ?? ''} ${token.lastName ?? ''}`.trim() || session.user.name
        session.user.email = token.email ?? session.user.email
        session.user.image = token.picture ?? null
        session.user.linkedInUrl = token.linkedInUrl
      }
      return session
    },
  },
} satisfies NextAuthConfig
