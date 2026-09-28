import { describe, it, expect } from 'vitest'
import {
  collectOrganizations,
  getCurrentCity,
  indexMember,
  matchesTokens,
  matchPlace,
  matchQuery,
  normalize,
  suggestCities,
  tokenize,
  type DirectoryMember,
} from '@/lib/directorySearch'

const base: DirectoryMember = { firstName: 'Camille', lastName: 'Martin', userType: 'alumni' }

// Membre typique : la ville n'est renseignée nulle part en champ dédié,
// seulement dans les noms d'écoles et d'entreprises
const engineer: DirectoryMember = {
  ...base,
  promotionYear: 2017,
  experience: [
    { company: 'Airbus', position: 'Ingénieure structures', location: 'Toulouse', startDate: '2023-09-01', current: true },
    { company: 'Naval Group à Brest', position: 'Stage opérateur', startDate: '2020-06-01', endDate: '2020-07-01' },
  ],
  education: [
    { school: 'Lycée Victor Hugo à BESANCON (25)', degree: 'Bac S', startYear: 2014, endYear: 2017 },
    { school: 'ESIREM à DIJON (21)', degree: 'Prépa intégrée', startYear: 2017, endYear: 2019 },
    { school: 'ENSTA Bretagne, Brest (29200)', degree: "Diplôme d'ingénieur", field: 'Mécanique', startYear: 2019, endYear: 2022 },
  ],
}

const run = (member: DirectoryMember, query: string) => matchQuery(indexMember(member), tokenize(query))
const inCity = (member: DirectoryMember, city: string, scope: 'current' | 'any') =>
  matchPlace(indexMember(member), tokenize(city), scope)

describe('normalize', () => {
  it('ignore accents, casse et ponctuation', () => {
    expect(normalize('BESANÇON')).toBe('besancon')
    expect(normalize('Saint-Étienne')).toBe('saint etienne')
  })

  it('développe les abréviations de « Saint »', () => {
    expect(normalize('St-Etienne')).toBe('saint etienne')
    expect(normalize('Ste Foy')).toBe('sainte foy')
  })
})

describe('matchQuery', () => {
  it('trouve un membre par son nom, sans explication', () => {
    expect(run(engineer, 'camille')).toEqual({ score: 10, hint: undefined })
  })

  it('cherche dans tout le parcours et dit où', () => {
    const match = run(engineer, 'esirem')
    expect(match?.hint).toMatchObject({ kind: 'education' })
    expect(match?.hint?.label).toContain('ESIREM à DIJON (21)')
  })

  it('exige chaque terme quelque part dans le profil', () => {
    expect(run(engineer, 'ingénieure toulouse')).not.toBeNull()
    expect(run(engineer, 'ingénieure lyon')).toBeNull()
  })

  it('ne trouve pas un terme court au milieu d’un mot', () => {
    expect(run({ ...base, experience: [{ company: 'Sciences Po', position: 'Chargée', startDate: '2020-01-01' }] }, 'ens')).toBeNull()
  })

  it('trouve la promo', () => {
    expect(run(engineer, '2017')).not.toBeNull()
  })

  it('trouve une matière cochée', () => {
    expect(run({ ...base, subjects: ['biologie'] }, 'biologie')).not.toBeNull()
  })

  it('classe le nom avant le reste du parcours', () => {
    const byName = run({ ...base, lastName: 'Dijon' }, 'dijon')!
    const byPath = run(engineer, 'dijon')!
    expect(byName.score).toBeGreaterThan(byPath.score)
  })
})

describe('matchPlace', () => {
  it('trouve une ville passée écrite dans le nom de l’école', () => {
    expect(inCity(engineer, 'Dijon', 'any')?.hints[0].label).toContain('ESIREM')
  })

  it('trouve une ville écrite dans le nom de l’entreprise', () => {
    expect(inCity(engineer, 'brest', 'any')).not.toBeNull()
  })

  it('montre la formation avant le stage quand les deux sont dans la ville', () => {
    const hints = inCity(engineer, 'brest', 'any')!.hints
    expect(hints.map((hint) => hint.kind)).toEqual(['education', 'experience'])
    expect(hints[0].label).toContain('ENSTA Bretagne')
  })

  it('distingue ville actuelle et ville passée', () => {
    expect(inCity(engineer, 'Toulouse', 'current')).toEqual({ hints: [] })
    expect(inCity(engineer, 'Brest', 'current')).toBeNull()
  })

  it('n’explique pas une ville déjà lisible dans le nom de l’école affichée', () => {
    const student = { ...base, education: [{ school: 'ISAE SUPAERO, Toulouse', degree: "École d'ingénieur", startYear: 2021, endYear: 2024 }] }
    expect(inCity(student, 'toulouse', 'any')).toEqual({ hints: [] })
  })

  it('ne compte pas le passage au lycée comme un séjour à Besançon', () => {
    expect(inCity(engineer, 'Besançon', 'any')).toBeNull()
  })

  it('privilégie la ville actuelle indiquée sur le profil', () => {
    const moved = { ...engineer, city: 'Lyon' }
    expect(getCurrentCity(moved)).toBe('Lyon')
    expect(inCity(moved, 'lyon', 'current')).toEqual({ hints: [] })
  })

  it('situe le personnel à Besançon', () => {
    const staff = { ...base, userType: 'staff', staffDetails: 'Professeur de mathématiques' }
    expect(inCity(staff, 'besancon', 'current')).toEqual({ hints: [] })
  })

  it('ne confond pas une ville avec le début d’un autre mot', () => {
    expect(inCity({ ...base, city: 'Paris' }, 'aris', 'any')).toBeNull()
  })
})

describe('suggestCities', () => {
  it('extrait les villes des noms d’écoles et compte les membres comme le filtre', () => {
    const other: DirectoryMember = { ...base, firstName: 'Léo', city: 'Brest' }
    const suggestions = suggestCities([engineer, other].map(indexMember), 'any')
    expect(suggestions[0]).toEqual({ name: 'Brest', count: 2 })
    expect(suggestions.map((s) => s.name)).toEqual(expect.arrayContaining(['Dijon', 'Toulouse']))
    expect(suggestions.map((s) => s.name)).not.toContain('Besançon')
  })
})

describe('matchesTokens', () => {
  it('trouve par début de mot, sans accents', () => {
    expect(matchesTokens('Sciences Po Paris', tokenize('sci po'))).toBe(true)
    expect(matchesTokens('Santé & médecine', tokenize('medecine'))).toBe(true)
  })

  it('ne trouve pas au milieu d’un mot', () => {
    expect(matchesTokens('Sciences Po Paris', tokenize('ences'))).toBe(false)
  })

  it('ne propose rien pour une recherche vide', () => {
    expect(matchesTokens('Brest', [])).toBe(false)
  })
})

describe('collectOrganizations', () => {
  it('compte chaque membre une fois par école et écarte le lycée', () => {
    const organizations = collectOrganizations([engineer, { ...base, firstName: 'Léo', education: [{ school: 'ESIREM à DIJON (21)', degree: 'Master', startYear: 2020 }] }].map(indexMember))
    expect(organizations[0]).toEqual({ name: 'ESIREM à DIJON (21)', count: 2 })
    expect(organizations.map((o) => o.name)).toEqual(expect.arrayContaining(['Airbus', 'ENSTA Bretagne, Brest (29200)']))
    expect(organizations.map((o) => o.name).join()).not.toMatch(/Victor Hugo/)
  })
})
