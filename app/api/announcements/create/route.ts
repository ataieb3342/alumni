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
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les données du formulaire
    const data = await request.json()
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
    } = data

    // Validation basique
    if (!title || !type || !description) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      )
    }

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

    // TODO: Envoyer les notifications par email aux abonnés
    // await notifySubscribers(newAnnouncement)

    return NextResponse.json({
      success: true,
      announcementId: newAnnouncement._id,
      slug: slug,
    })
  } catch (error) {
    console.error('Erreur lors de la création de l\'annonce:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de l\'annonce' },
      { status: 500 }
    )
  }
}
