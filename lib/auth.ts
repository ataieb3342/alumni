// lib/auth.ts
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import LinkedInProvider from "next-auth/providers/linkedin"
import { serverClient } from "@/sanity/lib/server-client"
import bcrypt from "bcryptjs"
import { logActivity } from "./activity-logger"
import { logger } from "./logger"

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
          const user = await serverClient.fetch(
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
          logger.error("Erreur d'authentification credentials", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Connexion normale par credentials
      if (account?.provider === "credentials") {
        // Logger la connexion par credentials
        if (user?.id) {
          await logActivity({
            userId: user.id,
            action: 'login',
            details: 'Connexion par email/mot de passe',
          })
        }
        return true
      }

      // Connexion OAuth (Google ou LinkedIn)
      if (account && (account.provider === "google" || account.provider === "linkedin")) {
        try {
          // Normaliser l'email en minuscules pour la comparaison
          const normalizedEmail = user.email?.toLowerCase()

          // Vérifier si l'utilisateur existe déjà
          const existingUser = await serverClient.fetch(
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

            // Stocker l'ID de l'utilisateur pour l'utiliser dans les callbacks jwt/session
            // On le fait AVANT de vérifier le statut pour que la session soit créée correctement
            user.id = existingUser._id
            user.userType = existingUser.userType
            user.accountStatus = existingUser.accountStatus
            user.isNewUser = false

            // Vérifier le statut du compte
            // Si le compte n'est pas actif, rediriger vers la page de validation en attente
            if (existingUser.accountStatus !== 'active') {
              return '/validation-en-cours'
            }

            // Logger la connexion OAuth
            await logActivity({
              userId: existingUser._id,
              action: 'login',
              details: `Connexion via ${account.provider === 'google' ? 'Google' : 'LinkedIn'}`,
            })

            return true
          }

          // Ne pas créer l'utilisateur dans Sanity tout de suite
          // Les données seront stockées dans le token JWT via le callback jwt
          // L'utilisateur sera créé dans Sanity après la sélection du type

          user.id = 'temp-' + account.providerAccountId // ID temporaire
          user.isNewUser = true

          logger.debug('Nouvel utilisateur OAuth détecté', {
            email: normalizedEmail,
            provider: account.provider,
            tempId: user.id
          })

          // Le middleware se chargera de rediriger vers /choisir-type
          return true
        } catch (error) {
          logger.error("Erreur lors de la connexion OAuth", error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account, trigger, profile }) {
      if (user) {
        token.id = user.id ?? ''
        token.userType = user.userType ?? ''
        token.isNewUser = user.isNewUser ?? false
        token.provider = account?.provider ?? ''
        token.accountStatus = user.accountStatus ?? ''

        // Si c'est une nouvelle inscription OAuth (ID temporaire), stocker toutes les données
        if (user.id?.startsWith('temp-') && account && profile) {
          token.needsTypeSelection = true
          token.oauthProvider = account.provider
          token.oauthId = account.providerAccountId
          token.email = user.email

          // Extraire firstName et lastName du profil
          let firstName = ""
          let lastName = ""

          if (account.provider === "linkedin") {
            const linkedInProfile = profile as LinkedInProfile
            firstName = linkedInProfile.given_name || ""
            lastName = linkedInProfile.family_name || ""
            token.linkedInUrl = linkedInProfile.profile || ""
          } else if (account.provider === "google") {
            const googleProfile = profile as GoogleProfile
            firstName = googleProfile.given_name || ""
            lastName = googleProfile.family_name || ""
          }

          // Fallback sur le name
          if (!firstName && !lastName && user.name) {
            const nameParts = user.name.split(' ')
            firstName = nameParts[0] || ""
            lastName = nameParts.slice(1).join(' ') || ""
          }

          token.firstName = firstName
          token.lastName = lastName
          token.profileData = JSON.stringify(profile)
        }
      }

      // Si c'est une mise à jour de session, récupérer les dernières données
      if (trigger === "update") {
        // Si c'est un ID temporaire, chercher l'utilisateur par email
        if (token.id?.startsWith('temp-')) {
          const email = token.email
          logger.debug('JWT Update: ID temporaire détecté', { email })
          if (email) {
            const newUser = await serverClient.fetch(
              `*[_type == "user" && email == $email][0]{
                _id,
                email,
                firstName,
                lastName,
                userType,
                accountStatus
              }`,
              { email }
            )

            if (newUser) {
              // Remplacer l'ID temporaire par le vrai ID Sanity
              logger.debug('JWT Update: Remplacement du token temporaire', { userId: newUser._id })
              token.id = newUser._id
              token.userType = newUser.userType
              token.accountStatus = newUser.accountStatus
              token.firstName = newUser.firstName
              token.lastName = newUser.lastName
              token.isNewUser = false
              token.needsTypeSelection = false
            } else {
              logger.warn('JWT Update: Utilisateur non trouvé', { email })
            }
          }
        } else if (token.id) {
          // Utilisateur existant, récupérer les données mises à jour
          const updatedUser = await serverClient.fetch(
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
            token.isNewUser = false
          }
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
        session.user.needsTypeSelection = token.needsTypeSelection as boolean

        // Si c'est un ID temporaire, utiliser les données du token
        if (token.id.startsWith('temp-')) {
          session.user.firstName = token.firstName as string
          session.user.lastName = token.lastName as string
          session.user.name = `${token.firstName} ${token.lastName}`
          session.user.email = token.email as string
          session.user.linkedInUrl = token.linkedInUrl as string
        } else {
          // Sinon, récupérer les données depuis Sanity
          const userData = await serverClient.fetch(
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
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      logger.debug('Redirect callback appelé', { url, baseUrl })

      // Si l'URL est déjà une URL complète avec le baseUrl, l'utiliser telle quelle
      if (url.startsWith(baseUrl)) {
        logger.debug('Redirection vers URL complète', { url })
        return url
      }

      // Si l'URL commence par "/", c'est un chemin relatif, l'ajouter au baseUrl
      if (url.startsWith("/")) {
        const finalUrl = `${baseUrl}${url}`
        logger.debug('Redirection vers chemin relatif', { url, finalUrl })
        return finalUrl
      }

      // Si l'URL est une URL externe, vérifier qu'elle provient du même domaine
      try {
        const urlObj = new URL(url)
        const baseUrlObj = new URL(baseUrl)
        if (urlObj.origin === baseUrlObj.origin) {
          logger.debug('Redirection vers URL même domaine', { url })
          return url
        }
      } catch {
        // URL invalide, ignorer
      }

      // Par défaut, rediriger vers la page d'accueil
      logger.debug('Redirection par défaut vers baseUrl', { baseUrl })
      return baseUrl
    }
  },
  pages: {
    signIn: '/connexion',
  },
  session: {
    strategy: "jwt",
  },
})