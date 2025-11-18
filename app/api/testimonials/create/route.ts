import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { serverClient } from '@/sanity/lib/server-client'

// Fonction pour générer un slug à partir du titre
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
    .trim()
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Remplacer tirets multiples par un seul
    .substring(0, 96) // Limiter à 96 caractères
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer les données du formulaire
    const data = await request.json()
    const { title, type, excerpt, rating, tags, ...typeSpecificFields } = data

    // Validation basique
    if (!title || !type || !excerpt) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

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
      rating: rating ? parseInt(rating as string, 10) : undefined,
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
    Object.keys(typeSpecificFields).forEach((key) => {
      if (typeSpecificFields[key]) {
        testimonialData[key] = typeSpecificFields[key]
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
    console.error('Erreur lors de la création du témoignage:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du témoignage' },
      { status: 500 }
    )
  }
}
