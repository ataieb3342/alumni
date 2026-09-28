/**
 * Matières auxquelles un membre rattache son parcours.
 *
 * Pensées pour les lycéens : ils ne connaissent pas encore les écoles ni les
 * métiers, mais savent s'ils aiment les maths ou la bio. En cochant « Maths »
 * et « Biologie » dans l'annuaire, ils tombent sur les anciens dont le
 * parcours part de là.
 */
export const SUBJECTS = [
  { value: 'maths', label: 'Mathématiques', short: 'Maths', emoji: '📐', keywords: 'mathématiques statistiques' },
  { value: 'physique', label: 'Physique', short: 'Physique', emoji: '⚛️', keywords: 'physique-chimie mécanique astrophysique' },
  { value: 'chimie', label: 'Chimie', short: 'Chimie', emoji: '🧪', keywords: 'physique-chimie pharmacie' },
  { value: 'biologie', label: 'Biologie & SVT', short: 'Biologie', emoji: '🧬', keywords: 'svt sciences de la vie vivant génétique écologie' },
  { value: 'sante', label: 'Santé & médecine', short: 'Santé', emoji: '🩺', keywords: 'médecine pass las infirmier pharmacie kiné dentaire' },
  { value: 'informatique', label: 'Informatique & numérique', short: 'Informatique', emoji: '💻', keywords: 'nsi code programmation développeur numérique data ia' },
  { value: 'ingenierie', label: "Sciences de l'ingénieur", short: 'Ingénierie', emoji: '⚙️', keywords: 'si ingénieur mécanique énergie' },
  { value: 'economie', label: 'Économie, gestion & commerce', short: 'Éco & commerce', emoji: '📈', keywords: 'ses gestion commerce finance management marketing' },
  { value: 'droit', label: 'Droit & sciences politiques', short: 'Droit & politique', emoji: '⚖️', keywords: 'sciences po politique avocat' },
  { value: 'histoire', label: 'Histoire-géo & géopolitique', short: 'Histoire-géo', emoji: '🏛️', keywords: 'hggsp géographie géopolitique' },
  { value: 'psychologie', label: 'Psychologie & sciences sociales', short: 'Psycho & socio', emoji: '🧠', keywords: 'psycho sociologie sciences sociales' },
  { value: 'litterature', label: 'Littérature', short: 'Littérature', emoji: '📚', keywords: 'lettres hlp français' },
  { value: 'philosophie', label: 'Philosophie', short: 'Philo', emoji: '💭', keywords: 'philo hlp' },
  { value: 'langues', label: 'Langues étrangères', short: 'Langues', emoji: '🌍', keywords: 'anglais allemand espagnol italien chinois llcer lea' },
  { value: 'arts', label: 'Arts & culture', short: 'Arts', emoji: '🎨', keywords: 'musique cinéma théâtre design architecture dessin' },
  { value: 'sport', label: 'Sport', short: 'Sport', emoji: '⚽', keywords: 'staps eps' },
] as const

export type SubjectValue = (typeof SUBJECTS)[number]['value']

export const SUBJECT_VALUES = SUBJECTS.map((s) => s.value) as [SubjectValue, ...SubjectValue[]]

/** Au-delà de trois, tout le monde coche tout et le filtre ne trie plus rien */
export const MAX_SUBJECTS = 3

const SUBJECTS_BY_VALUE = new Map<string, (typeof SUBJECTS)[number]>(SUBJECTS.map((s) => [s.value, s]))

export function getSubject(value: string) {
  return SUBJECTS_BY_VALUE.get(value)
}
