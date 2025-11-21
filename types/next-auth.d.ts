import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      userType: string
      firstName?: string
      lastName?: string
      isNewUser?: boolean
      provider?: string
      accountStatus?: string
      needsTypeSelection?: boolean
      linkedInUrl?: string
      profileImage?: any // Sanity image object
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    userType?: string
    isNewUser?: boolean
    accountStatus?: string
    needsTypeSelection?: boolean
    firstName?: string
    lastName?: string
    linkedInUrl?: string
    provider?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    userType?: string
    isNewUser?: boolean
    provider?: string
    accountStatus?: string
    needsTypeSelection?: boolean
    oauthProvider?: string
    oauthId?: string
    firstName?: string
    lastName?: string
    linkedInUrl?: string
    profileData?: string
  }
}
