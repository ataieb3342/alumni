import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Désactivé pour avoir les données en temps réel (important pour l'auth et les données sensibles)
  token: process.env.SANITY_API_TOKEN, // Token pour les opérations d'écriture (PATCH, DELETE, etc.)
})
