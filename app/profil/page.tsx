import type { Metadata } from 'next'
import { requireMemberPage } from '@/lib/auth/session'
import { PageHero } from '@/app/components/site/PageHero'
import { ProfileForm } from '@/app/components/profile/ProfileForm'

export const metadata: Metadata = { title: 'Mon profil' }

export default async function ProfilePage() {
  const user = await requireMemberPage('/profil')
  return (
    <>
      <PageHero size="sm" eyebrow="Mon compte" title="Mon profil" lead="Ce que les autres membres voient de vous dans l’annuaire. Plus il est complet, plus les lycéens vous trouvent." />
      <div className="container-page py-10">
        <div className="mx-auto max-w-3xl">
          <ProfileForm
            user={{
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              userType: user.userType,
              promotionYear: user.promotionYear,
              currentStudies: user.currentStudies,
              linkedIn: user.linkedIn,
              bio: user.bio,
              city: user.city,
              subjects: user.subjects,
              isVisibleInDirectory: user.isVisibleInDirectory,
              staffCategory: user.staffCategory,
              staffDetails: user.staffDetails,
              education: user.education,
              experience: user.experience,
              profileImage: user.profileImage,
              coverImage: user.coverImage,
            }}
          />
        </div>
      </div>
    </>
  )
}
