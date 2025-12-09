import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { serverClient } from '@/sanity/lib/server-client'
import { logger } from '@/lib/logger'
import { createTestimonialSchema } from '@/lib/validations'
import { generateSlug } from '@/lib/utils'
import { rateLimit, RateLimitPresets } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = rateLimit(request, RateLimitPresets.contentCreation)
  if (!rateLimitResult.success) {
    return rateLimitResult.response
  }

  try {
    // Vérifier l'authentification
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer les données du formulaire
    const data = await request.json()

    // Valider les données avec Zod
    const validation = createTestimonialSchema.safeParse(data)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      )
    }

    const { title, type, excerpt, rating, tags, ...typeSpecificFields } = validation.data

    // Générer un slug unique
    const baseSlug = generateSlug(title)
    const timestamp = Date.now()
    const slug = `${baseSlug}-${timestamp}`

    // Convertir les tags en tableau
    const tagsArray = tags
      ? tags
          .split(',')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag.length > 0)
      : []

    // Préparer les données du témoignage
    const testimonialData: Record<string, unknown> = {
      _type: 'testimonial',
      title,
      slug: {
        _type: 'slug',
        current: slug,
      },
      type,
      excerpt,
      rating, // Déjà validé et transformé par Zod
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      author: {
        _type: 'reference',
        _ref: session.user.id,
      },
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'published',
      likes: 0,
    }

    // Ajouter les champs spécifiques au type
    Object.entries(typeSpecificFields).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        testimonialData[key] = value
      }
    })

    // Créer le document dans Sanity
    const newTestimonial = await serverClient.create({
      _type: 'testimonial',
      ...testimonialData,
    })

    return NextResponse.json({
      success: true,
      testimonialId: newTestimonial._id,
      slug: slug,
    })
  } catch (error) {
    logger.error('Erreur lors de la création du témoignage:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du témoignage' },
      { status: 500 }
    )
  }
}
