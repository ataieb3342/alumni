import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { userByIdQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
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

  const userTypeLabels: Record<string, string> = {
    current_student: 'Élève actuel',
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

      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Photo de couverture */}
        {user.coverImage ? (
          <div className="w-full h-64 md:h-80 overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 relative">
            <Image
              src={urlFor(user.coverImage).width(1920).height(480).fit('crop').crop('center').url()}
              alt="Photo de couverture"
              width={1920}
              height={320}
              className="object-cover w-full h-full"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        ) : (
          <div className="w-full h-64 md:h-80 bg-gradient-to-br from-blue-600 to-blue-800"></div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 pb-12">
          {/* Breadcrumb */}
          <Link
            href="/annuaire"
            className="group inline-flex items-center gap-2 text-white hover:text-blue-100 font-medium transition-colors mb-6 drop-shadow-lg"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à l&apos;annuaire
          </Link>

          {/* Layout à 2 colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne gauche - Carte de profil */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md sticky top-8">
                {/* Image de profil */}
                <div className="p-6 text-center border-b">
                  {user.profileImage ? (
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-blue-100 shadow-lg mb-4">
                      <Image
                        src={urlFor(user.profileImage).width(300).height(300).fit('crop').crop('center').url()}
                        alt={`${user.firstName} ${user.lastName}`}
                        width={128}
                        height={128}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center border-4 border-blue-100 shadow-lg mb-4">
                      <div className="text-4xl font-bold text-white">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                    </div>
                  )}

                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {user.firstName} {user.lastName}
                  </h1>

                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-900 text-sm font-medium rounded-full">
                    {userTypeLabels[user.userType]}
                  </span>
                </div>

                {/* Informations de contact */}
                <div className="p-6 space-y-4">
                  {user.promotionYear && (
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <span className="text-xl">🎓</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Promotion</p>
                        <p className="text-sm font-semibold text-gray-900">{user.promotionYear}</p>
                      </div>
                    </div>
                  )}

                  {user.currentCity && (
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <span className="text-xl">📍</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Localisation</p>
                        <p className="text-sm font-semibold text-gray-900">{user.currentCity}</p>
                      </div>
                    </div>
                  )}

                  {user.currentJob && (
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                        <span className="text-xl">💼</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Poste</p>
                        <p className="text-sm font-semibold text-gray-900">{user.currentJob}</p>
                      </div>
                    </div>
                  )}

                  {user.company && (
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                        <span className="text-xl">🏢</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Entreprise</p>
                        <p className="text-sm font-semibold text-gray-900">{user.company}</p>
                      </div>
                    </div>
                  )}

                  {user.currentStudies && (
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <span className="text-xl">📚</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Études actuelles</p>
                        <p className="text-sm font-semibold text-gray-900">{user.currentStudies}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Boutons d'action */}
                <div className="p-6 pt-0 space-y-3">
                  <a
                    href={`mailto:${user.email}`}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium text-center transition-colors shadow-sm hover:shadow-md"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Envoyer un message
                    </span>
                  </a>

                  {user.linkedIn && (
                    <a
                      href={formatLinkedInUrl(user.linkedIn)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-[#0077B5] hover:bg-[#006399] text-white px-4 py-3 rounded-lg font-medium text-center transition-colors shadow-sm hover:shadow-md"
                    >
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        Voir le profil LinkedIn
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne droite - Contenu détaillé */}
            <div className="lg:col-span-2 space-y-6">
              {/* À propos */}
              {user.bio && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    À propos
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {user.bio}
                  </p>
                </div>
              )}

              {/* Expériences professionnelles */}
              {user.experience && user.experience.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Expérience professionnelle
                  </h2>
                  <div className="space-y-6">
                    {user.experience.map((exp: {
                      company: string
                      position: string
                      location?: string
                      startDate: string
                      endDate?: string
                      current?: boolean
                      description?: string
                    }, index: number) => (
                      <div key={index} className="relative pl-8 pb-6 border-l-2 border-gray-200 last:pb-0 last:border-l-0">
                        <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white"></div>

                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-gray-900">{exp.position}</h3>
                            <p className="text-blue-900 font-semibold">{exp.company}</p>
                            {exp.location && (
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {exp.location}
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-sm text-gray-600 font-medium whitespace-nowrap block">
                              {new Date(exp.startDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                              {' - '}
                              {exp.current ? 'Présent' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : ''}
                            </span>
                            {exp.current && (
                              <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                Poste actuel
                              </span>
                            )}
                          </div>
                        </div>

                        {exp.description && (
                          <p className="text-gray-700 text-sm mt-3 leading-relaxed whitespace-pre-line">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formations */}
              {user.education && user.education.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Formation
                  </h2>
                  <div className="space-y-6">
                    {user.education.map((edu: {
                      school: string
                      degree: string
                      field?: string
                      startYear: number
                      endYear?: number
                      description?: string
                    }, index: number) => (
                      <div key={index} className="relative pl-8 pb-6 border-l-2 border-gray-200 last:pb-0 last:border-l-0">
                        <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white"></div>

                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-gray-900">{edu.degree}</h3>
                            <p className="text-blue-900 font-semibold">{edu.school}</p>
                            {edu.field && (
                              <p className="text-sm text-gray-600 mt-1">{edu.field}</p>
                            )}
                          </div>

                          <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                            {edu.startYear} - {edu.endYear || 'En cours'}
                          </span>
                        </div>

                        {edu.description && (
                          <p className="text-gray-700 text-sm mt-3 leading-relaxed">
                            {edu.description}
                          </p>
                        )}
                      </div>
                    ))}
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
