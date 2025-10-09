// types/next-auth.d.ts
import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    userType?: string
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      userType?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    userType?: string
  }
}