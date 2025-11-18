import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { testimonialQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'

interface Author {
  _id: string
  firstName: string
  lastName: string
  email: string
  userType: string
  promotionYear?: string
  bio?: string
  linkedIn?: string
  profileImage?: {
    asset: {
      _id: string
      url: string
    }
  }
}

interface Testimonial {
  _id: string
  title: string
  slug: {
    current: string
  }
  type: string
  excerpt: string
  rating?: number
  likes?: number
  tags?: string[]
  publishedAt: string
  createdAt: string
  featuredImage?: {
    asset: {
      _id: string
      url: string
    }
  }
  author: Author

  // Études
  studies_school?: string
  studies_program?: string
  studies_year?: string
  studies_why?: string
  studies_strengths?: string
  studies_challenges?: string
  studies_advice?: string

  // Entreprise
  company_name?: string
  company_position?: string
  company_duration?: string
  company_context?: string
  company_missions?: string
  company_learnings?: string
  company_how?: string

  // Parcours
  career_journey?: string
  career_transition?: string
  career_turning_point?: string
  career_advice?: string

  // International
  international_location?: string
  international_duration?: string
  international_why?: string
  international_daily_life?: string
  international_best_memory?: string
  international_challenges?: string

  // Mentorat
  mentoring_topic?: string
  mentoring_context?: string
  mentoring_advice?: string
  mentoring_mistakes?: string

  // Projet
  project_name?: string
  project_description?: string
  project_role?: string
  project_challenges?: string
  project_outcome?: string
  project_learnings?: string
}

const typeConfig: Record<string, { emoji: string; label: string; color: string }> = {
  studies: { emoji: '🎓', label: 'Études & Formation', color: 'bg-blue-100 text-blue-700' },
  company: { emoji: '💼', label: 'Entreprise & Stage', color: 'bg-purple-100 text-purple-700' },
  career: { emoji: '🚀', label: 'Parcours Pro', color: 'bg-green-100 text-green-700' },
  international: {
    emoji: '🌍',
    label: 'International',
    color: 'bg-orange-100 text-orange-700',
  },
  mentoring: { emoji: '💡', label: 'Conseil & Mentorat', color: 'bg-yellow-100 text-yellow-700' },
  project: { emoji: '🎯', label: 'Projet', color: 'bg-pink-100 text-pink-700' },
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface QAItemProps {
  question: string
  answer: string | undefined
  icon?: string
}

function QAItem({ question, answer, icon }: QAItemProps) {
  if (!answer) return null

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {question}
      </h3>
      <p className="text-gray-700 leading-relaxed whitespace-pre-line pl-7">{answer}</p>
    </div>
  )
}

export default async function TestimonialDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const session = await auth()

  if (!session) {
    redirect('/connexion?callbackUrl=/temoignages/' + slug)
  }

  const testimonial: Testimonial = await client.fetch(testimonialQuery, { slug })

  if (!testimonial) {
    notFound()
  }

  const config = typeConfig[testimonial.type] || typeConfig.studies
  const authorImageUrl = testimonial.author.profileImage
    ? urlFor(testimonial.author.profileImage).width(200).height(200).url()
    : null

  const renderTypeSpecificContent = () => {
    switch (testimonial.type) {
      case 'studies':
        return (
          <div className="space-y-8">
            {testimonial.studies_school && (
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {testimonial.studies_school && (
                    <div>
                      <p className="text-sm text-blue-600 font-medium mb-1">École</p>
                      <p className="text-gray-900 font-semibold">{testimonial.studies_school}</p>
                    </div>
                  )}
                  {testimonial.studies_program && (
                    <div>
                      <p className="text-sm text-blue-600 font-medium mb-1">Formation</p>
                      <p className="text-gray-900 font-semibold">{testimonial.studies_program}</p>
                    </div>
                  )}
                  {testimonial.studies_year && (
                    <div>
                      <p className="text-sm text-blue-600 font-medium mb-1">Année(s)</p>
                      <p className="text-gray-900 font-semibold">{testimonial.studies_year}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <QAItem
              question="Pourquoi ce choix ?"
              answer={testimonial.studies_why}
              icon="💭"
            />
            <QAItem
              question="Les points forts"
              answer={testimonial.studies_strengths}
              icon="⭐"
            />
            <QAItem
              question="Les défis rencontrés"
              answer={testimonial.studies_challenges}
              icon="🎯"
            />
            <QAItem
              question="Mon conseil aux futurs étudiants"
              answer={testimonial.studies_advice}
              icon="💡"
            />
          </div>
        )

      case 'company':
        return (
          <div className="space-y-8">
            {testimonial.company_name && (
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {testimonial.company_name && (
                    <div>
                      <p className="text-sm text-purple-600 font-medium mb-1">Entreprise</p>
                      <p className="text-gray-900 font-semibold">{testimonial.company_name}</p>
                    </div>
                  )}
                  {testimonial.company_position && (
                    <div>
                      <p className="text-sm text-purple-600 font-medium mb-1">Poste</p>
                      <p className="text-gray-900 font-semibold">{testimonial.company_position}</p>
                    </div>
                  )}
                  {testimonial.company_duration && (
                    <div>
                      <p className="text-sm text-purple-600 font-medium mb-1">Durée</p>
                      <p className="text-gray-900 font-semibold">{testimonial.company_duration}</p>
                    </div>
                  )}
                  {testimonial.company_context && (
                    <div>
                      <p className="text-sm text-purple-600 font-medium mb-1">Contexte</p>
                      <p className="text-gray-900 font-semibold">{testimonial.company_context}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <QAItem
              question="Missions principales"
              answer={testimonial.company_missions}
              icon="📋"
            />
            <QAItem
              question="Ce que j'ai appris"
              answer={testimonial.company_learnings}
              icon="📚"
            />
            <QAItem
              question="Comment j'ai décroché cette opportunité"
              answer={testimonial.company_how}
              icon="🎯"
            />
          </div>
        )

      case 'career':
        return (
          <div className="space-y-8">
            <QAItem
              question="Mon parcours en quelques mots"
              answer={testimonial.career_journey}
              icon="🚀"
            />
            <QAItem
              question="Les transitions clés"
              answer={testimonial.career_transition}
              icon="🔄"
            />
            <QAItem
              question="Le moment décisif"
              answer={testimonial.career_turning_point}
              icon="⚡"
            />
            <QAItem
              question="Mon meilleur conseil"
              answer={testimonial.career_advice}
              icon="💡"
            />
          </div>
        )

      case 'international':
        return (
          <div className="space-y-8">
            {testimonial.international_location && (
              <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {testimonial.international_location && (
                    <div>
                      <p className="text-sm text-orange-600 font-medium mb-1">Destination</p>
                      <p className="text-gray-900 font-semibold">
                        {testimonial.international_location}
                      </p>
                    </div>
                  )}
                  {testimonial.international_duration && (
                    <div>
                      <p className="text-sm text-orange-600 font-medium mb-1">Durée</p>
                      <p className="text-gray-900 font-semibold">
                        {testimonial.international_duration}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <QAItem
              question="Pourquoi cette destination ?"
              answer={testimonial.international_why}
              icon="🤔"
            />
            <QAItem
              question="Le quotidien là-bas"
              answer={testimonial.international_daily_life}
              icon="☀️"
            />
            <QAItem
              question="Le meilleur souvenir"
              answer={testimonial.international_best_memory}
              icon="✨"
            />
            <QAItem
              question="Les défis de l'expatriation"
              answer={testimonial.international_challenges}
              icon="🎯"
            />
          </div>
        )

      case 'mentoring':
        return (
          <div className="space-y-8">
            {testimonial.mentoring_topic && (
              <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-100">
                <p className="text-sm text-yellow-600 font-medium mb-1">Sujet</p>
                <p className="text-gray-900 font-semibold">{testimonial.mentoring_topic}</p>
              </div>
            )}

            <QAItem question="Contexte" answer={testimonial.mentoring_context} icon="📖" />
            <QAItem question="Mes conseils" answer={testimonial.mentoring_advice} icon="💡" />
            <QAItem
              question="Les erreurs à éviter"
              answer={testimonial.mentoring_mistakes}
              icon="⚠️"
            />
          </div>
        )

      case 'project':
        return (
          <div className="space-y-8">
            {testimonial.project_name && (
              <div className="bg-pink-50 rounded-xl p-6 border border-pink-100">
                <p className="text-sm text-pink-600 font-medium mb-1">Nom du projet</p>
                <p className="text-gray-900 font-semibold text-xl">{testimonial.project_name}</p>
              </div>
            )}

            <QAItem
              question="Description du projet"
              answer={testimonial.project_description}
              icon="📝"
            />
            <QAItem question="Mon rôle" answer={testimonial.project_role} icon="👤" />
            <QAItem
              question="Les défis"
              answer={testimonial.project_challenges}
              icon="🎯"
            />
            <QAItem question="Le résultat" answer={testimonial.project_outcome} icon="🏆" />
            <QAItem
              question="Ce que j'en retiens"
              answer={testimonial.project_learnings}
              icon="💡"
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8">
        {/* Hero avec image de couverture */}
        {testimonial.featuredImage && (
          <div className="relative h-72 overflow-hidden mb-8">
            <img
              src={urlFor(testimonial.featuredImage).width(1920).height(600).url()}
              alt={testimonial.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <Link href="/temoignages" className="hover:text-blue-600 transition-colors">
              Témoignages
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-gray-900 font-medium truncate">{testimonial.title}</span>
          </nav>

          {/* Header du témoignage */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 overflow-hidden mb-8">
            <div className="flex items-start justify-between mb-6">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.color}`}
              >
                <span>{config.emoji}</span>
                <span>{config.label}</span>
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(testimonial.publishedAt)}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {testimonial.title}
            </h1>

            <p className="text-lg text-gray-600 mb-6 leading-relaxed">{testimonial.excerpt}</p>

            {/* Rating et tags */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {testimonial.rating && (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-100">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-semibold text-gray-900">{testimonial.rating}/5</span>
                </div>
              )}

              {testimonial.likes !== undefined && testimonial.likes > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-red-500">❤️</span>
                  <span className="font-semibold text-gray-900">{testimonial.likes}</span>
                </div>
              )}
            </div>

            {testimonial.tags && testimonial.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {testimonial.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Auteur */}
            <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
              {authorImageUrl ? (
                <img
                  src={authorImageUrl}
                  alt={`${testimonial.author.firstName} ${testimonial.author.lastName}`}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                  {testimonial.author.firstName[0]}
                  {testimonial.author.lastName[0]}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {testimonial.author.firstName} {testimonial.author.lastName}
                </p>
                <p className="text-xs text-gray-600">
                  {testimonial.author.userType === 'alumni' ? 'Alumni' : 'Étudiant'}
                  {testimonial.author.promotionYear && ` • Promo ${testimonial.author.promotionYear}`}
                </p>
              </div>
              {testimonial.author.linkedIn && (
                <a
                  href={testimonial.author.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
                >
                  <span>LinkedIn</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Contenu du témoignage */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            {renderTypeSpecificContent()}
          </div>

          {/* Bio de l'auteur */}
          {testimonial.author.bio && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 mt-8">
              <h3 className="text-lg font-bold text-gray-900 mb-3">À propos de l&apos;auteur</h3>
              <p className="text-gray-700 leading-relaxed text-sm">{testimonial.author.bio}</p>
            </div>
          )}

          {/* CTA + Retour */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/temoignages"
              className="group inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Retour aux témoignages</span>
            </Link>
            <Link
              href="/temoignages/nouveau"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <span>Partager mon expérience</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
