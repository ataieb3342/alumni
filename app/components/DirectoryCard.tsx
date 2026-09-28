'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Briefcase, GraduationCap, MapPin, Quote } from 'lucide-react'
import { getImageProps } from '@/sanity/lib/image'
import {
  getMemberSummary,
  MEMBER_TYPE_LABELS,
  type DirectoryMember,
  type MatchHint,
} from '@/lib/directorySearch'
import { getSubject } from '@/lib/subjects'

export interface DirectoryUser extends DirectoryMember {
  _id: string
  email?: string
  profileImage?: {
    asset: {
      _id: string
      url: string
    }
  }
  _createdAt?: string
}

interface DirectoryCardProps {
  users: DirectoryUser[]
  showNewBadge?: boolean
  currentUserId?: string
  /** Pourquoi chaque membre ressort d'une recherche, quand ça ne se lit pas sur sa carte */
  hints?: Record<string, MatchHint[]>
  /** Matières cochées dans le filtre, mises en avant sur la carte */
  highlightSubjects?: string[]
}

// Varier la teinte des initiales évite un mur de pastilles bleues identiques
const AVATAR_TINTS = [
  'bg-blue-100 text-blue-700',
  'bg-indigo-100 text-indigo-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
]

function tintFor(id: string) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return AVATAR_TINTS[Math.abs(hash) % AVATAR_TINTS.length]
}

const HINT_ICONS = {
  experience: Briefcase,
  education: GraduationCap,
  bio: Quote,
}

export default function DirectoryCard({
  users,
  showNewBadge = false,
  currentUserId,
  hints,
  highlightSubjects = [],
}: DirectoryCardProps) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 [&>*]:min-w-0">
      {users.map((user) => {
        const { headline, organization, isEducation, city } = getMemberSummary(user)
        const main = headline ?? organization
        const secondary = headline ? organization : undefined
        const RoleIcon = isEducation ? GraduationCap : Briefcase
        const subjects = (user.subjects ?? []).map(getSubject).filter((s) => s !== undefined)
        const userHints = hints?.[user._id] ?? []
        const isMe = user._id === currentUserId

        // Nouveau membre : inscrit il y a moins de 30 jours
        const isNew = showNewBadge && user._createdAt
          ? (new Date().getTime() - new Date(user._createdAt).getTime()) / (1000 * 60 * 60 * 24) < 30
          : false

        return (
          <Link
            key={user._id}
            href={`/annuaire/${user._id}`}
            className={`group flex flex-col h-full bg-white rounded-2xl border p-5 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-200 ${
              isMe ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start gap-4">
              {user.profileImage ? (
                <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-gray-100 ring-2 ring-white shadow">
                  <Image
                    {...getImageProps(user.profileImage, 112, 112)}
                    alt=""
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div
                  aria-hidden="true"
                  className={`w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-lg font-semibold ${tintFor(user._id)}`}
                >
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 leading-snug break-words group-hover:text-blue-700 transition-colors">
                    {user.firstName} {user.lastName}
                  </h3>
                  {isMe && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Vous
                    </span>
                  )}
                  {isNew && !isMe && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500 text-white">
                      Nouveau
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-gray-500">
                  {MEMBER_TYPE_LABELS[user.userType]}
                  {user.promotionYear && ` · Promo ${user.promotionYear}`}
                </p>
              </div>
            </div>

            {(main || city) && (
              <div className="mt-4 space-y-2 text-sm">
                {main && (
                  <p className="flex items-start gap-2">
                    <RoleIcon className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 line-clamp-2">
                      <span className="font-medium text-gray-900">{main}</span>
                      {secondary && <span className="text-gray-600"> · {secondary}</span>}
                    </span>
                  </p>
                )}
                {city && (
                  <p className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 break-words">{city}</span>
                  </p>
                )}
              </div>
            )}

            {!main && !city && subjects.length === 0 && (
              <p className="mt-4 text-sm text-gray-400 italic">Parcours pas encore renseigné</p>
            )}

            {subjects.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Matières">
                {subjects.map((subject) => (
                  <li
                    key={subject.value}
                    title={subject.label}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      highlightSubjects.includes(subject.value)
                        ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-300'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span aria-hidden="true">{subject.emoji}</span>
                    {subject.short}
                  </li>
                ))}
              </ul>
            )}

            {userHints.length > 0 && (
              <div className="mt-auto pt-4">
                <div className="pt-3 border-t border-dashed border-gray-200 space-y-1.5">
                  {userHints.map((hint) => {
                    const Icon = HINT_ICONS[hint.kind]
                    return (
                      <p key={hint.label} className="flex items-start gap-2 text-xs text-gray-600">
                        <Icon className="w-3.5 h-3.5 mt-0.5 text-amber-500 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 line-clamp-2">{hint.label}</span>
                      </p>
                    )
                  })}
                </div>
              </div>
            )}
          </Link>
        )
      })}
    </div>
  )
}
