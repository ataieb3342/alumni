import type { DirectoryUser } from './data/users'
import type { ImageRef } from '@/db/schema'
import type { DirectoryMember } from './directorySearch'

/** Membre tel qu'envoyé au navigateur pour la recherche et les cartes */
export interface DirectoryCardUser extends DirectoryMember {
  id: string
  email?: string
  profileImage?: ImageRef | null
  createdAt?: string | Date
}

/** Champs utiles à la recherche et aux cartes, rien de plus vers le navigateur */
export function toCardUser(member: DirectoryUser): DirectoryCardUser {
  return {
    id: member.id,
    email: member.email,
    firstName: member.firstName,
    lastName: member.lastName,
    userType: member.userType,
    promotionYear: member.promotionYear ?? undefined,
    city: member.city ?? undefined,
    subjects: member.subjects,
    currentStudies: member.currentStudies ?? undefined,
    staffDetails: member.staffDetails ?? undefined,
    bio: member.bio ?? undefined,
    description: member.description ?? undefined,
    experience: member.experience,
    education: member.education.map((edu) => ({ ...edu, startYear: edu.startYear, endYear: edu.endYear ?? undefined })),
    profileImage: member.profileImage,
    createdAt: member.createdAt,
  }
}

