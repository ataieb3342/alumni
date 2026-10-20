/**
 * Chiffres du réseau (accueil visiteur, accueil membre) calculés depuis l'annuaire.
 */
import { collectOrganizations, indexMember, suggestCities } from '@/lib/directorySearch'
import { listDirectoryMembers } from './users'

export async function getNetworkFigures() {
  const members = await listDirectoryMembers()
  const indexed = members.map(indexMember)
  return {
    members: members.length,
    cities: suggestCities(indexed, 'any').length,
    organizations: collectOrganizations(indexed).length,
  }
}
