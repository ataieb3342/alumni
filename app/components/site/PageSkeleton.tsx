import { Skeleton } from '@/app/components/ui/Spinner'

/**
 * Chargement sobre : la silhouette de la page plutôt qu'une animation plein
 * écran. Utilisé seulement par les pages membres (loading.tsx) : à la racine,
 * il ferait répondre 200 aux pages introuvables (streaming avant le 404).
 */
export function PageSkeleton() {
  return (
    // Hauteur d'écran : le pied de page reste hors champ jusqu'à l'arrivée du contenu (pas de décalage visible)
    <div className="container-page min-h-[100svh] py-12" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement…</span>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-12 w-2/3 max-w-xl" />
      <Skeleton className="mt-3 h-5 w-1/2 max-w-md" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-40 rounded-[var(--radius-lg)]" />
        ))}
      </div>
    </div>
  )
}
