import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { client } from "@/sanity/lib/client"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
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

        // Récupérer l'utilisateur depuis Sanity
        const user = await client.fetch(
          `*[_type == "user" && email == $email][0]`,
          { email: credentials.email }
        )

        if (!user || !user.password) {
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
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.userType = user.userType
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.userType = token.userType as string
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