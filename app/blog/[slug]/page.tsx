import { client } from '@/sanity/lib/client'
import { postQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { PortableText } from '@portabletext/react'
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
  body: any
}

// Composants personnalisés pour le PortableText
const components = {
  types: {
    image: ({ value }: any) => {
      return (
        <div className="my-8">
          <Image
            src={urlFor(value).width(1200).url()}
            alt={value.alt || 'Image'}
            width={1200}
            height={600}
            className="rounded-lg w-full h-auto"
          />
          {value.caption && (
            <p className="text-sm text-gray-600 text-center mt-2 italic">
              {value.caption}
            </p>
          )}
        </div>
      )
    },
  },
  block: {
    h2: ({ children }: any) => (
      <h2 className="text-3xl font-bold mt-8 mb-4 text-gray-900">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-2xl font-bold mt-6 mb-3 text-gray-900">{children}</h3>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-900 pl-4 italic my-6 text-gray-700">
        {children}
      </blockquote>
    ),
  },
}

export default async function ArticlePage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const post = await client.fetch<Post>(postQuery, { slug: params.slug })

  if (!post) {
    notFound()
  }

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gray-50">
        {/* Image hero */}
        {post.mainImage && (
          <div className="relative h-96 w-full bg-gray-900">
            <Image
              src={urlFor(post.mainImage).width(1920).height(800).url()}
              alt={post.mainImage.alt || post.title}
              fill
              className="object-cover opacity-80"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
          </div>
        )}
        
        {/* Contenu de l'article */}
        <article className="max-w-4xl mx-auto px-6 -mt-32 relative z-10">
          <div className="bg-white rounded-lg shadow-xl p-8 md:p-12">
            {/* Breadcrumb */}
            <Link 
              href="/blog" 
              className="text-blue-900 hover:underline mb-6 inline-flex items-center"
            >
              ← Retour aux articles
            </Link>
            
            {/* Header */}
            <header className="mb-8 border-b pb-6">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
                {post.title}
              </h1>
              
              <time className="text-gray-600">
                Publié le {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
              
              {post.excerpt && (
                <p className="text-xl text-gray-700 mt-4 italic leading-relaxed">
                  {post.excerpt}
                </p>
              )}
            </header>
            
            {/* Corps de l'article */}
            <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-900 prose-strong:text-gray-900">
              <PortableText 
                value={post.body} 
                components={components}
              />
            </div>
          </div>
          
          {/* Navigation */}
          <div className="mt-12 text-center">
            <Link 
              href="/blog"
              className="inline-block bg-blue-900 hover:bg-blue-800 text-white px-8 py-3 rounded transition font-semibold"
            >
              Voir tous les articles
            </Link>
          </div>
        </article>
      </main>
      
      <Footer />
    </>
  )
}