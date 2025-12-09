import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

// Type pour les images Sanity
interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  alt?: string
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

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
      profileImage?: {
        asset?: {
          _ref?: string
          _type?: string
          url?: string
        }
      }
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
