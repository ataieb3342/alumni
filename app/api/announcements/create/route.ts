import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { serverClient } from '@/sanity/lib/server-client'
import { generateSlug } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { createAnnouncementSchema } from '@/lib/validations'
import { rateLimit, RateLimitPresets } from '@/lib/rate-limit'
import { notifySubscribers } from '@/lib/notifications'

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
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les données du formulaire
    const data = await request.json()

    // Valider les données avec Zod
    const validation = createAnnouncementSchema.safeParse(data)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      )
    }

    const {
      title,
      type,
      company,
      location,
      description,
      contactEmail,
      contactPhone,
      externalLink,
      expiresAt,
      userId,
    } = validation.data

    // Vérifier que l'utilisateur crée sa propre annonce
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Générer un slug unique
    const baseSlug = generateSlug(title)
    const timestamp = Date.now()
    const slug = `${baseSlug}-${timestamp}`

    // Convertir la description en format Portable Text (simple bloc de texte)
    const portableTextDescription = [
      {
        _type: 'block',
        _key: 'block1',
        style: 'normal',
        children: description.split('\n\n').flatMap((paragraph: string, pIndex: number) => {
          const lines = paragraph.split('\n')
          return lines.flatMap((line: string, lIndex: number) => {
            const result = []
            if (pIndex > 0 || lIndex > 0) {
              // Ajouter un saut de ligne sauf pour la première ligne
              result.push({
                _type: 'span',
                _key: `span-${pIndex}-${lIndex}-break`,
                text: '\n',
                marks: [],
              })
            }
            result.push({
              _type: 'span',
              _key: `span-${pIndex}-${lIndex}`,
              text: line,
              marks: [],
            })
            return result
          })
        }),
        markDefs: [],
      },
    ]

    // Créer le document dans Sanity
    const newAnnouncement = await serverClient.create({
      _type: 'announcement',
      title,
      slug: {
        _type: 'slug',
        current: slug,
      },
      type,
      company: company || undefined,
      location: location || undefined,
      description: portableTextDescription,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      externalLink: externalLink || undefined,
      author: {
        _type: 'reference',
        _ref: userId,
      },
      publishedAt: new Date().toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      status: 'published',
    })

    // Envoyer les notifications par email aux abonnés (de manière asynchrone)
    // On n'attend pas le résultat pour ne pas ralentir la création de l'annonce
    notifySubscribers(newAnnouncement).catch((error) => {
      logger.error('Erreur lors de la notification des abonnés', error)
    })

    return NextResponse.json({
      success: true,
      announcementId: newAnnouncement._id,
      slug: slug,
    })
  } catch (error) {
    logger.error('Erreur lors de la création de l\'annonce', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de l\'annonce' },
      { status: 500 }
    )
  }
}
