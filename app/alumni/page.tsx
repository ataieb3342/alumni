import AlumniContent from './AlumniContent'

export const metadata = {
  title: 'Rejoins VH Besançon Alumni',
  description: 'Retrouve tes anciens camarades de Victor Hugo et développe ton réseau professionnel',
}

export default async function AlumniPage() {
  // Page autonome accessible à tous (connectés ou non)
  // Utilisée pour la campagne email alumni
  return <AlumniContent />
}
