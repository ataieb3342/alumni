import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { userByIdQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { getMostRecentActivity } from '@/lib/userUtils'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import Link from 'next/link'
import Image from 'next/image'

export default async function MemberDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/connexion')
  }

  const user = await client.fetch(userByIdQuery, { userId: id })

  if (!user) {
    notFound()
  }

  // Extraire les infos les plus récentes (expérience ou formation)
  const { currentJob, company, currentCity, isEducation } = getMostRecentActivity(user)

  const userTypeLabels: Record<string, string> = {
    lyceen: 'Lycéen',
    bts: 'BTS',
    prepa: 'Prépa',
    alumni: 'Ancien élève',
    staff: 'Personnel',
  }

  const formatLinkedInUrl = (url: string | undefined) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return `https://${url}`
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Photo de couverture */}
        {user.coverImage ? (
          <div className="w-full h-56 md:h-72 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 relative">
            <Image
              src={urlFor(user.coverImage).width(1920).height(580).fit('crop').crop('center').url()}
              alt="Photo de couverture"
              width={1920}
              height={580}
              className="object-cover w-full h-full"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-white/90"></div>
          </div>
        ) : (
          <div className="w-full h-56 md:h-72 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-purple-400/20"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90"></div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-16">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <Link
              href="/annuaire"
              className="inline-flex items-center gap-2 text-sm text-gray-900 hover:text-gray-700 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour à l&apos;annuaire
            </Link>
          </nav>

          {/* Layout 2 colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Colonne gauche - Carte profil */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden sticky top-18">
                {/* Photo de profil */}
                <div className="px-6 pt-6 pb-6 text-center border-b border-gray-100">
                  {user.profileImage ? (
                    <div className="w-32 h-32 mx-auto rounded-2xl overflow-hidden ring-4 ring-white shadow-xl mb-4">
                      <Image
                        src={urlFor(user.profileImage).width(400).height(400).fit('crop').crop('center').url()}
                        alt={`${user.firstName} ${user.lastName}`}
                        width={128}
                        height={128}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center ring-4 ring-white shadow-xl mb-4">
                      <div className="text-4xl font-bold text-white">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                    </div>
                  )}

                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {user.firstName} {user.lastName}
                  </h1>

                  <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200">
                    {userTypeLabels[user.userType]}
                  </span>
                </div>

                {/* Informations rapides */}
                <div className="px-6 py-5 space-y-4">
                  {user.promotionYear && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Promotion</p>
                        <p className="text-sm font-semibold text-gray-900">{user.promotionYear}</p>
                      </div>
                    </div>
                  )}

                  {currentJob && (
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isEducation ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {isEducation ? (
                            <>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </>
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          )}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                          {isEducation ? 'Formation actuelle' : 'Poste actuel'}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">{currentJob}</p>
                      </div>
                    </div>
                  )}

                  {company && (
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isEducation ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {isEducation ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          )}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                          {isEducation ? 'École' : 'Entreprise'}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">{company}</p>
                      </div>
                    </div>
                  )}

                  {currentCity && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                          {isEducation ? 'Domaine' : 'Localisation'}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">{currentCity}</p>
                      </div>
                    </div>
                  )}

                  {user.currentStudies && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Études actuelles</p>
                        <p className="text-sm font-semibold text-gray-900">{user.currentStudies}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Email</p>
                      <a href={`mailto:${user.email}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700 break-all">
                        {user.email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 space-y-3">
                  {user.linkedIn && (
                    <a
                      href={formatLinkedInUrl(user.linkedIn)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-gray-800 hover:to-gray-900 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                      Voir le profil
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne droite - Parcours */}
            <div className="lg:col-span-8 space-y-6">
              {/* À propos */}
              {user.bio && (
                <div className="bg-gradient-to-br from-white via-blue-50/40 to-blue-100/30 rounded-2xl shadow-lg border-2 border-blue-200 p-6 md:p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2.5">
                    <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full shadow-sm"></div>
                    À propos
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                    {user.bio}
                  </p>
                </div>
              )}

              {/* Expériences professionnelles */}
              {user.experience && user.experience.length > 0 && (
                <div className="bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/30 rounded-2xl shadow-lg border-2 border-emerald-200 p-6 md:p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2.5">
                    <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full shadow-sm"></div>
                    Expérience professionnelle
                  </h2>
                  <div className="space-y-6">
                    {[...user.experience]
                      .sort((a, b) => {
                        const dateA = a.current ? new Date() : (a.endDate ? new Date(a.endDate) : new Date(a.startDate))
                        const dateB = b.current ? new Date() : (b.endDate ? new Date(b.endDate) : new Date(b.startDate))
                        return dateB.getTime() - dateA.getTime()
                      })
                      .map((exp: {
                        company: string
                        position: string
                        location?: string
                        startDate: string
                        endDate?: string
                        current?: boolean
                        description?: string
                      }, index: number, arr: unknown[]) => (
                        <div key={index} className="relative">
                          {/* Timeline */}
                          <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200">
                            {index === 0 && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-600"></div>}
                            {index < arr.length - 1 && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gray-300"></div>}
                          </div>

                          <div className="pl-8">
                            <div className="flex items-start justify-between gap-4 mb-1">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-900">{exp.position}</h3>
                              </div>
                              <div className="text-sm text-gray-600 whitespace-nowrap flex-shrink-0">
                                {new Date(exp.startDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                                {' - '}
                                {exp.current ? 'Présent' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : ''}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <p className="text-sm text-gray-700 font-medium">{exp.company}</p>
                              {exp.location && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <p className="text-sm text-gray-500">{exp.location}</p>
                                </>
                              )}
                            </div>
                            {exp.description && (
                              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                {exp.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Formations */}
              {user.education && user.education.length > 0 && (
                <div className="bg-gradient-to-br from-white via-purple-50/40 to-purple-100/30 rounded-2xl shadow-lg border-2 border-purple-200 p-6 md:p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2.5">
                    <div className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full shadow-sm"></div>
                    Formation
                  </h2>
                  <div className="space-y-6">
                    {[...user.education]
                      .sort((a, b) => {
                        const currentYear = new Date().getFullYear()
                        const yearA = a.endYear || currentYear
                        const yearB = b.endYear || currentYear
                        if (yearA === yearB) {
                          return (b.startYear || 0) - (a.startYear || 0)
                        }
                        return yearB - yearA
                      })
                      .map((edu: {
                        school: string
                        degree: string
                        field?: string
                        startYear: number
                        endYear?: number
                        description?: string
                      }, index: number, arr: unknown[]) => {
                        return (
                          <div key={index} className="relative">
                            {/* Timeline */}
                            <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200">
                              {index === 0 && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-600"></div>}
                              {index < arr.length - 1 && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gray-300"></div>}
                            </div>

                            <div className="pl-8">
                              <div className="flex items-start justify-between gap-4 mb-1">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base font-bold text-gray-900">{edu.degree}</h3>
                                </div>
                                <div className="text-sm text-gray-600 whitespace-nowrap flex-shrink-0">
                                  {edu.startYear} - {edu.endYear || 'En cours'}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mb-3">
                                <p className="text-sm text-gray-700 font-medium">{edu.school}</p>
                                {edu.field && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <p className="text-sm text-gray-500">{edu.field}</p>
                                  </>
                                )}
                              </div>
                              {edu.description && (
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                  {edu.description}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}