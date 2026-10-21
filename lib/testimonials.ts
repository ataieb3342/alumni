/**
 * Témoignages : types, questions propres à chaque type, conversion du
 * formulaire (champs à plat `studies_why`…) vers le modèle (réponses en JSON).
 */
import type { TestimonialType } from '@/db/schema'

export interface TestimonialQuestion {
  key: string
  label: string
  /** Libellé affiché sur le témoignage publié (à la première personne) */
  heading?: string
  long?: boolean
  placeholder?: string
  /** Affiché en en-tête (fiche d'identité), pas en question-réponse */
  fact?: boolean
}

export const TESTIMONIAL_TYPES_INFO: Record<TestimonialType, { label: string; short: string; description: string; questions: TestimonialQuestion[] }> = {
  studies: {
    label: 'Études & formation',
    short: 'Études',
    description: 'Une école, une prépa, une fac : raconte ce que tu y as vécu',
    questions: [
      { key: 'studies_school', label: 'École / université', fact: true, placeholder: 'INSA Lyon' },
      { key: 'studies_program', label: 'Formation / programme', fact: true, placeholder: 'Génie mécanique' },
      { key: 'studies_year', label: 'Année(s)', fact: true, placeholder: '2018-2021' },
      { key: 'studies_why', label: 'Pourquoi ce choix ?', long: true },
      { key: 'studies_strengths', label: 'Les points forts', long: true },
      { key: 'studies_challenges', label: 'Les défis rencontrés', long: true },
      { key: 'studies_advice', label: 'Ton conseil aux futurs étudiants', heading: 'Mon conseil aux futurs étudiants', long: true },
    ],
  },
  company: {
    label: 'Entreprise & stage',
    short: 'Entreprise',
    description: 'Un stage, une alternance, un premier poste',
    questions: [
      { key: 'company_name', label: "Nom de l'entreprise", fact: true },
      { key: 'company_position', label: 'Poste occupé', fact: true },
      { key: 'company_duration', label: 'Durée & période', fact: true, placeholder: '6 mois, été 2023' },
      { key: 'company_context', label: 'Contexte (stage, alternance, CDI…)', fact: true },
      { key: 'company_missions', label: 'Missions principales', long: true },
      { key: 'company_learnings', label: 'Ce que tu as appris', heading: "Ce que j'ai appris", long: true },
      { key: 'company_how', label: 'Comment tu as décroché cette opportunité', heading: "Comment j'ai décroché cette opportunité", long: true },
    ],
  },
  career: {
    label: 'Parcours professionnel',
    short: 'Parcours',
    description: 'Les grandes étapes, les virages, ce que tu en retiens',
    questions: [
      { key: 'career_journey', label: 'Ton parcours en quelques mots', heading: 'Mon parcours en quelques mots', long: true },
      { key: 'career_transition', label: 'Les transitions clés', long: true },
      { key: 'career_turning_point', label: 'Le moment décisif', long: true },
      { key: 'career_advice', label: 'Ton meilleur conseil', heading: 'Mon meilleur conseil', long: true },
    ],
  },
  international: {
    label: "Vie à l'international",
    short: 'International',
    description: 'Études ou travail à l’étranger',
    questions: [
      { key: 'international_location', label: 'Ville / pays', fact: true },
      { key: 'international_duration', label: 'Durée', fact: true, placeholder: '2 ans, 2020-2022' },
      { key: 'international_why', label: 'Pourquoi cette destination ?', long: true },
      { key: 'international_daily_life', label: 'Le quotidien là-bas', long: true },
      { key: 'international_best_memory', label: 'Le meilleur souvenir', long: true },
      { key: 'international_challenges', label: "Les défis de l'expatriation", long: true },
    ],
  },
  mentoring: {
    label: 'Conseil & mentorat',
    short: 'Conseils',
    description: 'Orientation, réseau, reconversion : ce que tu aurais aimé savoir',
    questions: [
      { key: 'mentoring_topic', label: 'Sujet du conseil', fact: true, placeholder: 'Orientation, réseau, reconversion…' },
      { key: 'mentoring_context', label: 'Contexte', long: true },
      { key: 'mentoring_advice', label: 'Tes conseils', heading: 'Mes conseils', long: true },
      { key: 'mentoring_mistakes', label: 'Les erreurs à éviter', long: true },
    ],
  },
  project: {
    label: 'Projet & réalisation',
    short: 'Projet',
    description: 'Une asso, une startup, un projet perso dont tu es fier·e',
    questions: [
      { key: 'project_name', label: 'Nom du projet', fact: true },
      { key: 'project_description', label: 'Description du projet', long: true },
      { key: 'project_role', label: 'Ton rôle', heading: 'Mon rôle', long: true },
      { key: 'project_challenges', label: 'Les défis techniques / humains', heading: 'Les défis', long: true },
      { key: 'project_outcome', label: 'Le résultat', long: true },
      { key: 'project_learnings', label: 'Ce que tu en retiens', heading: "Ce que j'en retiens", long: true },
    ],
  },
}

const ALL_KEYS = Object.values(TESTIMONIAL_TYPES_INFO).flatMap((info) => info.questions.map((q) => q.key))

/** Champs à plat du formulaire → modèle ; les réponses existantes non renvoyées sont conservées */
export function splitTestimonialInput(
  input: { title?: string; type?: TestimonialType; excerpt?: string; rating?: number; tags?: string; [key: string]: unknown },
  previousAnswers: Record<string, string> = {}
) {
  const answers: Record<string, string> = { ...previousAnswers }
  for (const key of ALL_KEYS) {
    const value = input[key]
    if (typeof value !== 'string') continue
    if (value.trim()) answers[key] = value.trim()
    else delete answers[key]
  }
  return {
    title: input.title ?? '',
    type: (input.type ?? 'studies') as TestimonialType,
    excerpt: input.excerpt ?? '',
    rating: typeof input.rating === 'number' ? input.rating : null,
    tags: (input.tags ?? '')
      .split(',')
      .map((tag) => tag.trim().replace(/^#/, ''))
      .filter(Boolean)
      .slice(0, 12),
    answers,
  }
}
