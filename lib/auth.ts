// lib/auth.ts
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import LinkedInProvider from "next-auth/providers/linkedin"
import { client } from "@/sanity/lib/client"
import { serverClient } from "@/sanity/lib/server-client"
import bcrypt from "bcryptjs"

// Types pour les profils OAuth
interface LinkedInProfile {
  given_name?: string
  family_name?: string
  picture?: string
  profile?: string
}

interface GoogleProfile {
  given_name?: string
  family_name?: string
  picture?: string
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET ? [
      LinkedInProvider({
        clientId: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        authorization: {
          params: {
            // Scopes de base (toujours approuvés)
            scope: 'openid profile email',
            // Pour accéder à plus de données (nécessite approbation LinkedIn) :
            // scope: 'openid profile email w_member_social r_basicprofile r_organization_social',
          }
        },
        // LinkedIn v2 API endpoints
        wellKnown: "https://www.linkedin.com/oauth/.well-known/openid-configuration",
      })
    ] : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Normaliser l'email en minuscules pour la comparaison
          const normalizedEmail = (credentials.email as string).toLowerCase()

          // Récupérer l'utilisateur depuis Sanity
          const user = await client.fetch(
            `*[_type == "user" && email == $email][0]{
              _id,
              email,
              firstName,
              lastName,
              password,
              userType,
              accountStatus
            }`,
            { email: normalizedEmail }
          )

          if (!user || !user.password) {
            return null
          }

          // Vérifier le statut du compte
          if (user.accountStatus !== 'active') {
            // Retourner null pour bloquer la connexion
            return null
          }

          // Vérifier le mot de passe
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          // Retourner les infos utilisateur
          return {
            id: user._id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            userType: user.userType,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Connexion normale par credentials
      if (account?.provider === "credentials") {
        return true
      }

      // Connexion OAuth (Google ou LinkedIn)
      if (account && (account.provider === "google" || account.provider === "linkedin")) {
        try {
          // Normaliser l'email en minuscules pour la comparaison
          const normalizedEmail = user.email?.toLowerCase()

          // Vérifier si l'utilisateur existe déjà
          const existingUser = await client.fetch(
            `*[_type == "user" && email == $email][0]{
              _id,
              email,
              firstName,
              lastName,
              userType,
              accountStatus,
              oauthProvider,
              oauthId
            }`,
            { email: normalizedEmail }
          )

          if (existingUser) {
            // Si l'utilisateur existe mais n'a pas de provider OAuth, on met à jour
            if (!existingUser.oauthProvider) {
              await serverClient
                .patch(existingUser._id)
                .set({
                  oauthProvider: account.provider,
                  oauthId: account.providerAccountId,
                })
                .commit()
            }

            // Vérifier le statut du compte
            // Si le compte n'est pas actif, bloquer la connexion
            if (existingUser.accountStatus !== 'active') {
              return '/validation-en-cours'
            }

            // Stocker l'ID de l'utilisateur pour l'utiliser dans les callbacks jwt/session
            user.id = existingUser._id
            user.userType = existingUser.userType
            user.isNewUser = false
            return true
          }

          // Créer un nouvel utilisateur
          // Mapper les données du profil OAuth
          let firstName = ""
          let lastName = ""
          let _profileImageUrl = ""
          let linkedInUrl = ""

          if (account.provider === "linkedin" && profile) {
            // LinkedIn renvoie given_name et family_name
            const linkedInProfile = profile as LinkedInProfile
            firstName = linkedInProfile.given_name || ""
            lastName = linkedInProfile.family_name || ""
            _profileImageUrl = linkedInProfile.picture || user.image || ""
            // L'URL LinkedIn peut être dans le profil ou construite
            linkedInUrl = linkedInProfile.profile || ""

            console.log('LinkedIn profile data:', profile) // Pour debug - voir toutes les données disponibles
          } else if (account.provider === "google" && profile) {
            const googleProfile = profile as GoogleProfile
            firstName = googleProfile.given_name || ""
            lastName = googleProfile.family_name || ""
            _profileImageUrl = googleProfile.picture || user.image || ""

            console.log('Google profile data:', profile) // Pour debug
          }

          // Si on n'a pas les noms, on les extrait du name complet
          if (!firstName && !lastName && user.name) {
            const nameParts = user.name.split(' ')
            firstName = nameParts[0] || ""
            lastName = nameParts.slice(1).join(' ') || ""
          }

          // Créer le nouvel utilisateur dans Sanity avec données OAuth
          const newUser = await serverClient.create({
            _type: 'user',
            firstName: firstName,
            lastName: lastName,
            email: normalizedEmail!,
            oauthProvider: account.provider,
            oauthId: account.providerAccountId,
            accountStatus: 'pending', // En attente de validation admin (cohérence avec inscription classique)
            userType: 'alumni', // Par défaut, peut être changé après
            role: 'member',
            isVisibleInDirectory: false, // Caché jusqu'à validation
            createdAt: new Date().toISOString(),
            // Ajouter l'URL LinkedIn si disponible
            ...(linkedInUrl ? { linkedIn: linkedInUrl } : {}),
            // TODO: Télécharger et stocker la photo de profil depuis profileImageUrl
            // Pour LinkedIn, stocker toutes les données brutes du profil pour mapping ultérieur
            ...(account.provider === 'linkedin' && profile ? {
              linkedInProfile: {
                raw: JSON.stringify(profile, null, 2)
              },
            } : {}),
            // Pour Google, stocker aussi les données si besoin
            ...(account.provider === 'google' && profile ? {
              googleProfile: {
                raw: JSON.stringify(profile, null, 2)
              },
            } : {})
          })

          user.id = newUser._id
          user.userType = 'alumni'
          user.isNewUser = true
          user.accountStatus = 'pending'

          // L'envoi d'email admin sera géré par une route API séparée
          // pour éviter les problèmes avec l'edge runtime du middleware

          // Bloquer la connexion pour les nouveaux utilisateurs OAuth en attente de validation
          return '/connexion?registered=true&pending=true'
        } catch (error) {
          console.error("OAuth sign in error:", error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id ?? ''
        token.userType = user.userType ?? ''
        token.isNewUser = user.isNewUser ?? false
        token.provider = account?.provider ?? ''
        token.accountStatus = user.accountStatus ?? ''
      }

      // Si c'est une mise à jour de session, récupérer les dernières données
      if (trigger === "update" && token.id) {
        const updatedUser = await client.fetch(
          `*[_type == "user" && _id == $id][0]{
            _id,
            email,
            firstName,
            lastName,
            userType,
            accountStatus
          }`,
          { id: token.id }
        )

        if (updatedUser) {
          token.userType = updatedUser.userType
          token.accountStatus = updatedUser.accountStatus
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.userType = token.userType as string
        session.user.isNewUser = token.isNewUser as boolean
        session.user.provider = token.provider as string
        session.user.accountStatus = token.accountStatus as string

        // Récupérer les données à jour depuis Sanity
        const userData = await client.fetch(
          `*[_type == "user" && _id == $id][0]{
            firstName,
            lastName,
            profileImage
          }`,
          { id: token.id }
        )

        if (userData) {
          session.user.firstName = userData.firstName
          session.user.lastName = userData.lastName
          session.user.name = `${userData.firstName} ${userData.lastName}`
          session.user.profileImage = userData.profileImage
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/connexion',
  },
  session: {
    strategy: "jwt",
  },
})