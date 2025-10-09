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
  // Ajouter await devant params
  const { id } = await params
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/connexion')
  }

  // Utiliser la variable id déstructurée
  const user = await client.fetch(userByIdQuery, { userId: id })

  if (!user) {
    notFound()
  }

  const userTypeLabels: Record<string, string> = {
    current_student: 'Élève actuel',
    alumni: 'Ancien élève',
    staff: 'Personnel',
  }

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-6">
          {/* Breadcrumb */}
          <Link 
            href="/annuaire" 
            className="text-blue-900 hover:underline mb-6 inline-flex items-center"
          >
            ← Retour à l&apos;annuaire
          </Link>

          {/* Carte profil */}
          <div className="bg-white rounded-lg shadow-xl overflow-hidden mt-6">
            {/* Header avec image */}
            <div className="relative h-64 bg-gradient-to-br from-blue-900 to-blue-600">
              {user.profileImage ? (
                <Image
                  src={urlFor(user.profileImage).width(800).height(400).url()}
                  alt={`${user.firstName} ${user.lastName}`}
                  fill
                  className="object-cover opacity-90"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-9xl font-bold text-white opacity-50">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                </div>
              )}
            </div>

            {/* Informations principales */}
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-lg text-gray-600">
                    {userTypeLabels[user.userType]}
                  </p>
                </div>

                {user.linkedIn && (
                  <a
                    href={user.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition flex items-center space-x-2"
                  >
                    <span>LinkedIn</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                )}
              </div>

              {/* Grille d'informations */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {user.promotionYear && (
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">🎓</div>
                    <div>
                      <p className="text-sm text-gray-600">Promotion</p>
                      <p className="font-semibold text-gray-900">{user.promotionYear}</p>
                    </div>
                  </div>
                )}

                {user.currentJob && (
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">💼</div>
                    <div>
                      <p className="text-sm text-gray-600">Poste</p>
                      <p className="font-semibold text-gray-900">{user.currentJob}</p>
                    </div>
                  </div>
                )}

                {user.company && (
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">🏢</div>
                    <div>
                      <p className="text-sm text-gray-600">Entreprise</p>
                      <p className="font-semibold text-gray-900">{user.company}</p>
                    </div>
                  </div>
                )}

                {user.currentStudies && (
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">📚</div>
                    <div>
                      <p className="text-sm text-gray-600">Études actuelles</p>
                      <p className="font-semibold text-gray-900">{user.currentStudies}</p>
                    </div>
                  </div>
                )}

                {user.email && (
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">📧</div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <a 
                        href={`mailto:${user.email}`}
                        className="font-semibold text-blue-900 hover:underline"
                      >
                        {user.email}
                      </a>
                    </div>
                  </div>
                )}

                {user.phone && (
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">📱</div>
                    <div>
                      <p className="text-sm text-gray-600">Téléphone</p>
                      <a 
                        href={`tel:${user.phone}`}
                        className="font-semibold text-blue-900 hover:underline"
                      >
                        {user.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Biographie */}
              {user.bio && (
                <div className="border-t pt-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">À propos</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {user.bio}
                  </p>
                </div>
              )}

              {/* Bouton contact */}
              <div className="border-t pt-6 mt-6 flex space-x-4">
                <a
                  href={`mailto:${user.email}`}
                  className="flex-1 bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-lg transition text-center font-semibold"
                >
                  Envoyer un email
                </a>
                {user.phone && (
                  <a
                    href={`tel:${user.phone}`}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition text-center font-semibold"
                  >
                    Appeler
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  )
}