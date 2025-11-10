import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { client } from '@/sanity/lib/client'

// DELETE - Supprimer une annonce
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

    // Vérifier que l'annonce appartient à l'utilisateur
    const announcement = await client.fetch(
      `*[_type == "announcement" && _id == $id][0] {
        _id,
        author->{_id}
      }`,
      { id }
    )

    if (!announcement) {
      return NextResponse.json(
        { error: 'Annonce non trouvée' },
        { status: 404 }
      )
    }

    if (announcement.author._id !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à supprimer cette annonce' },
        { status: 403 }
      )
    }

    // Supprimer l'annonce
    await client.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'annonce' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour une annonce
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

    // Vérifier que l'annonce appartient à l'utilisateur
    const announcement = await client.fetch(
      `*[_type == "announcement" && _id == $id][0] {
        _id,
        author->{_id}
      }`,
      { id }
    )

    if (!announcement) {
      return NextResponse.json(
        { error: 'Annonce non trouvée' },
        { status: 404 }
      )
    }

    if (announcement.author._id !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à modifier cette annonce' },
        { status: 403 }
      )
    }

    // Mettre à jour l'annonce
    const updatedAnnouncement = await client
      .patch(id)
      .set(body)
      .commit()

    return NextResponse.json(updatedAnnouncement)
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'annonce' },
      { status: 500 }
    )
  }
}
