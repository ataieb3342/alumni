import { client } from '@/sanity/lib/client'
import { postsQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Link from 'next/link'
import Image from 'next/image'

interface Post {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt?: string
  mainImage?: {
    asset: {
      _id: string
      url: string
    }
    alt?: string
  }
}

export default async function BlogPage() {
  const posts = await client.fetch<Post[]>(postsQuery)

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white py-20">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Notre Blog
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Explorez nos derniers articles, actualités et insights pour rester informé
            </p>
            <div className="mt-8 flex justify-center">
              <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></div>
            </div>
          </div>
        </section>

        {/* Blog Posts Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 -mt-10">
          {posts.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/20">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Aucun article pour le moment</h3>
                <p className="text-gray-600 mb-6">
                  Créez votre premier article dans le Studio Sanity pour commencer à partager votre contenu.
                </p>
                <Link 
                  href="/studio" 
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Aller au Studio
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="flex items-center gap-6 mb-12 text-sm text-gray-600">
                <span className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {posts.length} article{posts.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Grid des articles */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <Link 
                    key={post._id} 
                    href={`/blog/${post.slug.current}`}
                    className="group"
                  >
                    <article className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 h-full flex flex-col border border-white/20 hover:border-white/40">
                      {/* Image avec effet de superposition */}
                      {post.mainImage && (
                        <div className="relative h-56 w-full overflow-hidden">
                          <Image
                            src={urlFor(post.mainImage).width(800).height(400).url()}
                            alt={post.mainImage.alt || post.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Badge de date */}
                          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                            {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Contenu */}
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex-1">
                          <h2 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-blue-700 transition-colors duration-300 line-clamp-2 leading-tight">
                            {post.title}
                          </h2>
                          
                          {post.excerpt && (
                            <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                        
                        {/* Lien de lecture */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <span className="text-blue-700 font-semibold group-hover:text-blue-800 transition-colors flex items-center gap-2">
                            Lire l&apos;article
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {new Date(post.publishedAt).getFullYear()}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              {/* Call to Action */}
              <div className="text-center mt-16">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
                  <h3 className="text-2xl font-bold mb-4">Ne manquez aucun article</h3>
                  <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                    Abonnez-vous à notre newsletter pour recevoir nos derniers articles directement dans votre boîte mail.
                  </p>
                  <button className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-3 rounded-xl font-semibold transition-colors duration-300 transform hover:-translate-y-0.5 shadow-lg">
                    S&apos;abonner à la newsletter
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
      
      <Footer />
    </>
  )
}