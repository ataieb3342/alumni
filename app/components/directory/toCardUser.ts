import type { DirectoryUser } from '@/lib/data/users'
import type { DirectoryCardUser } from './DirectoryCard'

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

