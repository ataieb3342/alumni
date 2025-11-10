import { client } from '@/sanity/lib/client'
import { postsQuery } from '@/sanity/lib/queries'
import Header from '../components/Header'
import Footer from '../components/Footer'
import BlogContent from '../components/BlogContent'
import Link from 'next/link'
import HeroSection from '../components/HeroSection'

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
        {/* Hero Section avec image en background */}
        <HeroSection
          title="Notre Blog"
          subtitle="Explorez nos derniers articles, actualités et insights pour rester informé"
        />

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
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Aller au Studio
                </Link>
              </div>
            </div>
          ) : (
            <BlogContent posts={posts} />
          )}
        </section>
      </main>

      <Footer />
    </>
  )
}
