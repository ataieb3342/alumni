import fs from 'fs'
import { logger } from '@/lib/logger'
import path from 'path'

/**
 * Récupère une image aléatoire du dossier public/images
 * @returns Le chemin relatif de l'image (ex: "/images/nom-image.jpg")
 */
export function getRandomImage(): string {
  const imagesDirectory = path.join(process.cwd(), 'public', 'images')

  try {
    // Lire tous les fichiers du dossier
    const files = fs.readdirSync(imagesDirectory)

    // Filtrer pour ne garder que les images (jpg, jpeg, png, webp, gif)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
    })

    // Si aucune image n'est trouvée, retourner une image par défaut
    if (imageFiles.length === 0) {
      return '/images/lycee-victor-hugo.jpg'
    }

    // Sélectionner une image aléatoire
    const randomIndex = Math.floor(Math.random() * imageFiles.length)
    const selectedImage = imageFiles[randomIndex]

    return `/images/${selectedImage}`
  } catch (error) {
    logger.error('Erreur lors de la lecture du dossier images:', error)
    // Retourner une image par défaut en cas d'erreur
    return '/images/lycee-victor-hugo.jpg'
  }
}
