import { client } from '@/sanity/lib/client'
import { postQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { PortableText } from '@portabletext/react'
import { PortableTextBlock } from '@portabletext/types'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

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
  body: PortableTextBlock[]
}

// Fonction pour calculer le temps de lecture
function calculateReadingTime(body: PortableTextBlock[]): number {
  const wordsPerMinute = 200
  let wordCount = 0

  body.forEach(block => {
    if (block._type === 'block' && block.children) {
      block.children.forEach((child) => {
        if ('text' in child && typeof child.text === 'string') {
          wordCount += child.text.split(/\s+/).length
        }
      })
    }
  })

  return Math.ceil(wordCount / wordsPerMinute)
}

// Composants personnalisés pour le PortableText
const components = {
  types: {
    image: ({ value }: { value: { alt?: string; caption?: string; asset?: unknown; url?: string } }) => {
      // Gérer les deux types d'images : Sanity (avec asset) et URL directe (migration WordPress)
      const imageUrl = value.url || urlFor(value).width(1400).url()

      return (
        <figure className="my-12 -mx-4 sm:-mx-8 md:-mx-12">
          <div className="relative overflow-hidden rounded-2xl shadow-2xl group">
            <Image
              src={imageUrl}
              alt={value.alt || 'Image'}
              width={1400}
              height={700}
              className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          {value.caption && (
            <figcaption className="text-sm text-gray-500 text-center mt-4 italic px-4">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
  block: {
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-3xl md:text-4xl font-bold mt-16 mb-6 text-gray-900 tracking-tight">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-2xl md:text-3xl font-bold mt-12 mb-5 text-gray-900 tracking-tight">
        {children}
      </h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
      <h4 className="text-xl md:text-2xl font-semibold mt-10 mb-4 text-gray-800">
        {children}
      </h4>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="relative my-10 pl-8 pr-6 py-6 border-l-4 border-blue-600 bg-gradient-to-r from-blue-50/50 to-transparent rounded-r-xl">
        <div className="absolute top-4 left-2 text-blue-200 opacity-50">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>
        <div className="text-lg text-gray-700 italic font-medium">
          {children}
        </div>
      </blockquote>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-lg leading-relaxed text-gray-700 mb-6">
        {children}
      </p>
    ),
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="space-y-3 my-8 ml-6">
        {children}
      </ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="space-y-3 my-8 ml-6">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <li className="flex items-start gap-3 text-lg text-gray-700">
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-2.5"></span>
        <span className="flex-1">{children}</span>
      </li>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <li className="text-lg text-gray-700 ml-2">
        {children}
      </li>
    ),
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic text-gray-800">{children}</em>
    ),
    link: ({ children, value }: { children?: React.ReactNode; value?: { href?: string } }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-600 transition-colors font-medium"
      >
        {children}
      </a>
    ),
  },
}

export default async function ArticlePage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await client.fetch<Post>(postQuery, { slug })

  if (!post) {
    notFound()
  }

  const readingTime = calculateReadingTime(post.body)
  const articleUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://votre-site.com'}/blog/${slug}`
  const shareTitle = encodeURIComponent(post.title)
  const shareUrl = encodeURIComponent(articleUrl)

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Container principal */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          {/* Card de contenu */}
          <article className="relative bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Breadcrumb minimaliste */}
            <div className="px-6 sm:px-10 md:px-16 pt-10">
              <Link
                href="/blog"
                className="group inline-flex items-center gap-2 text-gray-600 hover:text-blue-700 font-medium transition-colors"
              >
                <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour au blog
              </Link>
            </div>

            {/* Image mise en valeur - Entière et centrée */}
            {post.mainImage && (
              <div className="relative w-full px-6 sm:px-10 md:px-16 mt-8 mb-10">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-100">
                  <Image
                    src={urlFor(post.mainImage).width(1600).quality(90).url()}
                    alt={post.mainImage.alt || post.title}
                    width={1600}
                    height={900}
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </div>
            )}

            {/* Header de l'article */}
            <header className="px-6 sm:px-10 md:px-16 pb-8">
              {/* Titre principal */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-8">
                {post.title}
              </h1>

              {/* Métadonnées de l'article */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                <time className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">
                    {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </time>

                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{readingTime} min de lecture</span>
                </div>
              </div>

              {/* Excerpt stylisé */}
              {post.excerpt && (
                <div className="mt-10 pt-10 border-t border-gray-100">
                  <p className="text-xl md:text-2xl leading-relaxed text-gray-600 font-light">
                    {post.excerpt}
                  </p>
                </div>
              )}
            </header>

            {/* Contenu de l'article avec typographie premium */}
            <div className="px-6 sm:px-10 md:px-16 pb-16">
              <div className="prose-custom max-w-none">
                <PortableText
                  value={post.body}
                  components={components}
                />
              </div>
            </div>

            {/* Footer de l'article */}
            <footer className="px-6 sm:px-10 md:px-16 pb-10 md:pb-16 border-t border-gray-100">
              <div className="pt-10 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <Link
                  href="/blog"
                  className="group inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Voir tous les articles
                </Link>

                {/* Boutons de partage */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 font-medium">Partager</span>
                  <div className="flex gap-2">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 hover:bg-blue-600 text-gray-600 hover:text-white transition-colors"
                      aria-label="Partager sur Facebook"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 hover:bg-black text-gray-600 hover:text-white transition-colors"
                      aria-label="Partager sur X (Twitter)"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 hover:bg-blue-700 text-gray-600 hover:text-white transition-colors"
                      aria-label="Partager sur LinkedIn"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </article>

          {/* Espace après l'article */}
          <div className="h-24" />
        </div>
      </main>

      <Footer />
    </>
  )
}