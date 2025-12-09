import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { client } from '@/sanity/lib/client'
import { logger } from '@/lib/logger'

// DELETE - Supprimer un témoignage
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Vérifier que le témoignage appartient à l'utilisateur
    const testimonial = await client.fetch(
      `*[_type == "testimonial" && _id == $id][0] {
        _id,
        author->{_id}
      }`,
      { id }
    )

    if (!testimonial) {
      return NextResponse.json(
        { error: 'Témoignage non trouvé' },
        { status: 404 }
      )
    }

    if (testimonial.author._id !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à supprimer ce témoignage' },
        { status: 403 }
      )
    }

    // Supprimer le témoignage
    await client.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Erreur lors de la suppression:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du témoignage' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour un témoignage
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await req.json()

    // Vérifier que le témoignage appartient à l'utilisateur
    const testimonial = await client.fetch(
      `*[_type == "testimonial" && _id == $id][0] {
        _id,
        author->{_id}
      }`,
      { id }
    )

    if (!testimonial) {
      return NextResponse.json(
        { error: 'Témoignage non trouvé' },
        { status: 404 }
      )
    }

    if (testimonial.author._id !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à modifier ce témoignage' },
        { status: 403 }
      )
    }

    // Mettre à jour le témoignage
    const updatedTestimonial = await client
      .patch(id)
      .set(body)
      .commit()

    return NextResponse.json(updatedTestimonial)
  } catch (error) {
    logger.error('Erreur lors de la mise à jour:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du témoignage' },
      { status: 500 }
    )
  }
}
