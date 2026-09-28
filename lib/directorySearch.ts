/**
 * Recherche de l'annuaire : texte libre, filtre par ville et résumé de carte.
 *
 * Une ville peut se trouver à plusieurs endroits d'un profil : « Ville
 * actuelle », lieu d'une expérience, ville d'une formation, ou — pour les
 * formations saisies avant l'ajout de ce champ — collée au nom de l'école
 * (« ESIREM à DIJON (21) »). On indexe tout, en distinguant ce qui est actuel
 * de ce qui appartient au parcours passé, pour pouvoir chercher « qui vit à
 * Lyon » comme « qui est déjà passé par Brest ».
 */
import { getMostRecentActivity } from './userUtils'
import { getSubject } from './subjects'

interface Experience {
  company: string
  position: string
  location?: string
  startDate: string
  endDate?: string
  current?: boolean
  description?: string
}

interface Education {
  school: string
  degree: string
  field?: string
  location?: string
  startYear: number
  endYear?: number
}

export interface DirectoryMember {
  firstName: string
  lastName: string
  userType: string
  promotionYear?: number
  city?: string
  subjects?: string[]
  currentStudies?: string
  staffDetails?: string
  bio?: string
  description?: string
  experience?: Experience[]
  education?: Education[]
}

export const MEMBER_TYPE_LABELS: Record<string, string> = {
  alumni: 'Ancien élève',
  prepa: 'Prépa',
  bts: 'BTS',
  staff: 'Personnel',
}

const LYCEE = 'Lycée Victor Hugo'
const LYCEE_CITY = 'Besançon'

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'a', 'au', 'aux', 'chez', 'd', 'dans', 'de', 'des', 'du', 'en', 'et',
  'l', 'la', 'le', 'les', 'pour', 'sur', 'un', 'une',
])

/**
 * Minuscules, sans accents ni ponctuation : « Saint-Étienne », « ST ETIENNE »
 * et « st-etienne » donnent tous « saint etienne ».
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bste\b/g, 'sainte')
    .replace(/\bst\b/g, 'saint')
    .trim()
}

export function tokenize(query: string): string[] {
  return normalize(query)
    .split(' ')
    .filter((token) => token && !STOPWORDS.has(token))
}

/** Le mot commence par le terme cherché : « info » trouve « informatique » */
function startsWord(text: string, token: string): boolean {
  return (' ' + text).includes(' ' + token)
}

// ---------------------------------------------------------------------------
// Résumé affiché sur la carte
// ---------------------------------------------------------------------------

/** Une formation sans année de fin, ou qui finit après l'été en cours, est en cours */
function isInProgress(edu: Education): boolean {
  if (!edu.endYear) return true
  const now = new Date()
  const lastFinishedYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
  return edu.endYear > lastFinishedYear
}

function isLycee(school: string | undefined): boolean {
  return !!school && normalize(school).includes('victor hugo')
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

/**
 * Ville où vit le membre aujourd'hui : celle qu'il a indiquée, sinon celle de
 * son poste actuel, sinon celle de sa formation en cours.
 */
export function getCurrentCity(member: DirectoryMember): string | undefined {
  if (member.userType === 'staff') return LYCEE_CITY
  return (
    clean(member.city) ??
    clean(member.experience?.find((exp) => exp.current && clean(exp.location))?.location) ??
    clean(member.education?.find((edu) => isInProgress(edu) && clean(edu.location))?.location)
  )
}

export interface MemberSummary {
  /** Poste, diplôme ou fonction au lycée */
  headline?: string
  /** Entreprise, école ou établissement */
  organization?: string
  isEducation: boolean
  city?: string
}

export function getMemberSummary(member: DirectoryMember): MemberSummary {
  if (member.userType === 'staff') {
    return {
      headline: clean(member.staffDetails),
      organization: LYCEE,
      isEducation: false,
      city: LYCEE_CITY,
    }
  }

  const { currentJob, company, isEducation } = getMostRecentActivity(member)
  return {
    headline: clean(currentJob) ?? clean(member.currentStudies),
    organization: clean(company),
    isEducation,
    city: getCurrentCity(member),
  }
}

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

/** Ce qui explique qu'un membre ressorte, quand ça ne se voit pas sur sa carte */
export interface MatchHint {
  kind: 'experience' | 'education' | 'bio'
  label: string
}

interface SearchEntry {
  text: string
  weight: number
  /** Déjà visible sur la carte : inutile d'expliquer la correspondance */
  visible: boolean
  hint?: MatchHint
}

interface PlaceEntry {
  text: string
  current: boolean
  hint?: MatchHint
}

export interface IndexedMember<T extends DirectoryMember = DirectoryMember> {
  member: T
  summary: MemberSummary
  entries: SearchEntry[]
  places: PlaceEntry[]
}

function yearOf(date: string | undefined): number | undefined {
  const year = date ? new Date(date).getFullYear() : NaN
  return Number.isNaN(year) ? undefined : year
}

export function describeExperience(exp: Experience): string {
  const start = yearOf(exp.startDate)
  const end = yearOf(exp.endDate)
  const period = exp.current
    ? start && `depuis ${start}`
    : start && (end && end !== start ? `${start}–${end}` : `${start}`)
  const where = clean(exp.location) ? ` (${exp.location!.trim()})` : ''
  return [`${exp.position} · ${exp.company}${where}`, period].filter(Boolean).join(' · ')
}

export function describeEducation(edu: Education): string {
  const where = clean(edu.location) ? ` (${edu.location!.trim()})` : ''
  const period = edu.startYear ? `${edu.startYear}–${edu.endYear ?? 'en cours'}` : undefined
  return [`${edu.degree} · ${edu.school}${where}`, period].filter(Boolean).join(' · ')
}

export function indexMember<T extends DirectoryMember>(member: T): IndexedMember<T> {
  const summary = getMemberSummary(member)
  const entries: SearchEntry[] = []
  const places: PlaceEntry[] = []

  const add = (raw: (string | undefined)[], weight: number, visible: boolean, hint?: MatchHint) => {
    const text = normalize(raw.filter(Boolean).join(' '))
    if (text) entries.push({ text, weight, visible, hint })
  }
  const addPlace = (raw: (string | undefined)[], current: boolean, hint?: MatchHint) => {
    const text = normalize(raw.filter(Boolean).join(' '))
    if (text) places.push({ text, current, hint })
  }

  // Ce que montre la carte
  add([member.firstName, member.lastName], 10, true)
  if (member.promotionYear) add(['promo', String(member.promotionYear)], 6, true)
  add([summary.headline], 6, true)
  add([summary.organization], 6, true)
  add([summary.city], 6, true)
  add([MEMBER_TYPE_LABELS[member.userType]], 2, true)
  for (const value of member.subjects ?? []) {
    add([getSubject(value)?.label], 5, true)
  }

  // Le reste du parcours
  if (member.userType === 'staff') addPlace([LYCEE_CITY], true)
  addPlace([member.city], true)

  for (const exp of member.experience ?? []) {
    const hint: MatchHint = { kind: 'experience', label: describeExperience(exp) }
    add([exp.position, exp.company, exp.location], exp.current ? 4 : 3, false, hint)
    add([exp.description], 1, false, hint)
    // Le nom de l'entreprise contient parfois la ville (« CHU de Brest »)
    addPlace([exp.location, exp.company], !!exp.current, hint)
  }

  for (const edu of member.education ?? []) {
    const hint: MatchHint = { kind: 'education', label: describeEducation(edu) }
    const inProgress = isInProgress(edu)
    add([edu.degree, edu.school, edu.field, edu.location], 3, false, hint)
    // Tout le monde est passé par le lycée : sans cette exclusion, « Besançon »
    // renverrait l'annuaire entier au lieu de ceux qui y ont vécu depuis.
    if (isLycee(edu.school) && !inProgress) continue
    addPlace([edu.location, edu.school], inProgress, hint)
  }

  add([member.bio, member.description], 1, false, { kind: 'bio', label: 'Mentionné dans sa présentation' })

  return { member, summary, entries, places }
}

// ---------------------------------------------------------------------------
// Correspondances
// ---------------------------------------------------------------------------

export interface QueryMatch {
  score: number
  hint?: MatchHint
}

/**
 * Chaque terme doit se retrouver quelque part dans le profil (« ingénieur
 * lyon » exige les deux). Le score favorise le nom, puis ce qui est visible
 * sur la carte, puis le reste du parcours.
 */
export function matchQuery(indexed: IndexedMember, tokens: string[]): QueryMatch | null {
  let score = 0
  let hint: MatchHint | undefined
  let hintWeight = 0

  for (const token of tokens) {
    let bestVisible = 0
    let bestHidden = 0
    let hiddenHint: MatchHint | undefined

    for (const entry of indexed.entries) {
      // Au milieu d'un mot seulement pour les termes assez longs :
      // « lyon » trouve « emlyon », mais « ens » ne trouve pas « sciences »
      const weight = startsWord(entry.text, token)
        ? entry.weight
        : token.length >= 4 && entry.text.includes(token)
          ? entry.weight / 2
          : 0
      if (!weight) continue
      if (entry.visible) {
        bestVisible = Math.max(bestVisible, weight)
      } else if (weight > bestHidden) {
        bestHidden = weight
        hiddenHint = entry.hint
      }
    }

    if (!bestVisible && !bestHidden) return null
    score += Math.max(bestVisible, bestHidden)
    if (!bestVisible && bestHidden > hintWeight) {
      hint = hiddenHint
      hintWeight = bestHidden
    }
  }

  return { score, hint }
}

export type CityScope = 'current' | 'any'

function placeMatches(text: string, cityTokens: string[]): boolean {
  return cityTokens.every((token) => startsWord(text, token))
}

/**
 * `current` : le membre y vit aujourd'hui. `any` : il y a vécu, étudié ou
 * travaillé à un moment de son parcours.
 */
export function matchPlace(
  indexed: IndexedMember,
  cityTokens: string[],
  scope: CityScope
): { hints: MatchHint[] } | null {
  const matching = indexed.places.filter(
    (place) => (scope === 'any' || place.current) && placeMatches(place.text, cityTokens)
  )
  if (matching.length === 0) return null

  // La ville se lit déjà sur la carte (ville actuelle, ou nom de l'école
  // « ISAE SUPAERO, Toulouse ») : pas besoin d'explication
  const visible = normalize([indexed.summary.city, indexed.summary.organization].filter(Boolean).join(' '))
  if (visible && placeMatches(visible, cityTokens)) return { hints: [] }

  // Deux étapes au plus : l'actuelle d'abord, puis les formations, qui parlent
  // davantage aux lycéens qu'un stage d'un mois
  const rank = (place: PlaceEntry) => (place.current ? 0 : place.hint?.kind === 'education' ? 1 : 2)
  const hints = matching
    .filter((place) => place.hint)
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, 2)
    .map((place) => place.hint!)
  return { hints }
}

// ---------------------------------------------------------------------------
// Suggestions de villes
// ---------------------------------------------------------------------------

// Formations saisies avant le champ « Ville » : la ville est dans le nom de l'école
const SCHOOL_CITY_PATTERNS: { pattern: RegExp; allowUppercase: boolean }[] = [
  { pattern: /\s+à\s+([^,()]+?)\s*(?:\(\d{2,5}\))?\s*$/i, allowUppercase: true }, // « ESIREM à DIJON (21) »
  { pattern: /,\s*([^,()]+?)\s*(?:\(\d{2,5}\))?\s*$/, allowUppercase: true }, // « INP-ENSEEIHT, Toulouse (31) »
  { pattern: /\s+de\s+([^\s,()]+)\s*\(\d{2,5}\)\s*$/i, allowUppercase: true }, // « Lycée Faidherbe de Lille (59) »
  { pattern: /\(([^()\d]+)\)\s*$/, allowUppercase: false }, // « Institution des Chartreux (Lyon) »
  { pattern: /\s+-\s+([^-()]+?)\s*$/, allowUppercase: false }, // « UFR SJEPG - Besançon »
]

const NOT_A_CITY = /\b(universite|faculte|ecole|lycee|institut|ufr|iut|campus|master|licence|bachelor|france)\b/

function extractCityFromSchool(school: string): string | undefined {
  for (const { pattern, allowUppercase } of SCHOOL_CITY_PATTERNS) {
    const candidate = school.trim().match(pattern)?.[1]?.trim()
    if (!candidate) continue
    const normalized = normalize(candidate)
    if (!normalized || normalized.split(' ').length > 4 || /\d/.test(normalized)) continue
    if (NOT_A_CITY.test(normalized)) continue
    // Un sigle entre parenthèses (« (ISAT) ») n'est pas une ville
    if (!allowUppercase && candidate === candidate.toUpperCase()) continue
    return candidate
  }
  return undefined
}

/** « Paris, Île-de-France, France » → « Paris » ; « Lyon 7e » → « Lyon » */
function cityFromLocation(location: string): string | undefined {
  return clean(location.split(/[,(/]|\s-\s/)[0].replace(/\s+\d.*$/, ''))
}

/** « GIF-SUR-YVETTE » → « Gif-sur-Yvette » ; une casse choisie par le membre est gardée */
function prettifyCity(raw: string): string {
  if (raw !== raw.toUpperCase()) return raw
  return raw
    .toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase())
    .replace(/-(Sur|Sous|En|Le|La|Les|De|Du|Des|Lès)-/g, (m) => m.toLowerCase())
}

function hasDiacritics(text: string): boolean {
  return text !== text.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export interface CitySuggestion {
  name: string
  count: number
}

/**
 * Villes présentes dans l'annuaire, avec le nombre de membres qu'on obtient
 * en filtrant dessus — le décompte passe par `matchPlace` pour correspondre
 * exactement aux résultats affichés au clic.
 */
export function suggestCities(members: IndexedMember[], scope: CityScope): CitySuggestion[] {
  const variants = new Map<string, Map<string, number>>()
  const collect = (raw: string | undefined) => {
    const city = raw && clean(raw)
    if (!city) return
    const key = normalize(city)
    if (!key) return
    const display = prettifyCity(city)
    const forKey = variants.get(key) ?? new Map<string, number>()
    forKey.set(display, (forKey.get(display) ?? 0) + 1)
    variants.set(key, forKey)
  }

  for (const { member } of members) {
    if (member.userType === 'staff') collect(LYCEE_CITY)
    collect(member.city)
    for (const exp of member.experience ?? []) {
      if (exp.location) collect(cityFromLocation(exp.location))
    }
    for (const edu of member.education ?? []) {
      if (edu.location) collect(cityFromLocation(edu.location))
      if (edu.school) collect(extractCityFromSchool(edu.school))
    }
  }

  const suggestions: CitySuggestion[] = []
  for (const [key, forKey] of variants) {
    // Préférer l'orthographe accentuée (« Besançon » plutôt que « BESANCON »)
    const [name] = [...forKey.entries()].sort(
      ([a, countA], [b, countB]) =>
        Number(hasDiacritics(b)) - Number(hasDiacritics(a)) || countB - countA
    )[0]
    const tokens = tokenize(key)
    const count = members.filter((m) => matchPlace(m, tokens, scope)).length
    if (count > 0) suggestions.push({ name, count })
  }

  return suggestions.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'))
}

// ---------------------------------------------------------------------------
// Suggestions de la barre de recherche
// ---------------------------------------------------------------------------

/** Chaque terme commence un mot du texte : « sci po » trouve « Sciences Po Paris » */
export function matchesTokens(text: string, tokens: string[]): boolean {
  const normalized = normalize(text)
  return tokens.length > 0 && tokens.every((token) => startsWord(normalized, token))
}

export interface OrganizationSuggestion {
  name: string
  count: number
}

/**
 * Écoles et entreprises citées dans l'annuaire, avec le nombre de membres
 * passés par chacune. Le lycée est exclu : tout le monde y est passé.
 */
export function collectOrganizations(members: IndexedMember[]): OrganizationSuggestion[] {
  const groups = new Map<string, { names: Map<string, number>; members: Set<IndexedMember> }>()
  const collect = (raw: string | undefined, entry: IndexedMember) => {
    const name = clean(raw)
    if (!name || isLycee(name)) return
    const key = normalize(name)
    if (!key || key === 'non specifie') return
    const group = groups.get(key) ?? { names: new Map<string, number>(), members: new Set<IndexedMember>() }
    group.names.set(name, (group.names.get(name) ?? 0) + 1)
    group.members.add(entry)
    groups.set(key, group)
  }

  for (const entry of members) {
    for (const edu of entry.member.education ?? []) collect(edu.school, entry)
    for (const exp of entry.member.experience ?? []) collect(exp.company, entry)
  }

  return [...groups.values()]
    .map(({ names, members: found }) => ({
      name: [...names.entries()].sort(([, a], [, b]) => b - a)[0][0],
      count: found.size,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'))
}
