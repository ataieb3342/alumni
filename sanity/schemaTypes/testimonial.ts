import { defineField, defineType } from 'sanity'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Témoignages',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre du témoignage',
      type: 'string',
      description: 'Un titre accrocheur pour votre témoignage',
      validation: (Rule) => Rule.required().min(10).max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Type de témoignage',
      type: 'string',
      options: {
        list: [
          { title: '🎓 Études & Formation', value: 'studies' },
          { title: '💼 Entreprise & Stage', value: 'company' },
          { title: '🚀 Parcours Professionnel', value: 'career' },
          { title: '🌍 Vie à l\'international', value: 'international' },
          { title: '💡 Conseil & Mentorat', value: 'mentoring' },
          { title: '🎯 Projet & Réalisation', value: 'project' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Auteur',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Résumé (aperçu)',
      type: 'text',
      description: 'Résumé court pour la carte (2-3 phrases)',
      rows: 3,
      validation: (Rule) => Rule.required().min(50).max(300),
    }),
    defineField({
      name: 'featuredImage',
      title: 'Image de couverture',
      type: 'image',
      description: 'Image optionnelle pour illustrer le témoignage',
      options: {
        hotspot: true,
      },
    }),

    // Questions spécifiques pour "Études & Formation"
    defineField({
      name: 'studies_school',
      title: 'École/Université',
      type: 'string',
      hidden: ({ document }) => document?.type !== 'studies',
    }),
    defineField({
      name: 'studies_program',
      title: 'Formation/Programme',
      type: 'string',
      hidden: ({ document }) => document?.type !== 'studies',
    }),
    defineField({
      name: 'studies_year',
      title: 'Année(s)',
      type: 'string',
      description: 'Ex: 2018-2021',
      hidden: ({ document }) => document?.type !== 'studies',
    }),
    defineField({
      name: 'studies_why',
      title: 'Pourquoi ce choix ?',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'studies',
    }),
    defineField({
      name: 'studies_strengths',
      title: 'Les points forts',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'studies',
    }),
    defineField({
      name: 'studies_challenges',
      title: 'Les défis rencontrés',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'studies',
    }),
    defineField({
      name: 'studies_advice',
      title: 'Ton conseil aux futurs étudiants',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'studies',
    }),

    // Questions spécifiques pour "Entreprise & Stage"
    defineField({
      name: 'company_name',
      title: 'Nom de l\'entreprise',
      type: 'string',
      hidden: ({ document }) => document?.type !== 'company',
    }),
    defineField({
      name: 'company_position',
      title: 'Poste occupé',
      type: 'string',
      hidden: ({ document }) => document?.type !== 'company',
    }),
    defineField({
      name: 'company_duration',
      title: 'Durée & période',
      type: 'string',
      description: 'Ex: 6 mois, été 2023',
      hidden: ({ document }) => document?.type !== 'company',
    }),
    defineField({
      name: 'company_context',
      title: 'Contexte (stage, alternance, CDI...)',
      type: 'string',
      hidden: ({ document }) => document?.type !== 'company',
    }),
    defineField({
      name: 'company_missions',
      title: 'Missions principales',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'company',
    }),
    defineField({
      name: 'company_learnings',
      title: 'Ce que tu as appris',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'company',
    }),
    defineField({
      name: 'company_how',
      title: 'Comment tu as décroché cette opportunité',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'company',
    }),

    // Questions spécifiques pour "Parcours Professionnel"
    defineField({
      name: 'career_journey',
      title: 'Ton parcours en quelques mots',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'career',
    }),
    defineField({
      name: 'career_transition',
      title: 'Les transitions clés',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'career',
    }),
    defineField({
      name: 'career_turning_point',
      title: 'Le moment décisif',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'career',
    }),
    defineField({
      name: 'career_advice',
      title: 'Ton meilleur conseil',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'career',
    }),

    // Questions spécifiques pour "Vie à l'international"
    defineField({
      name: 'international_location',
      title: 'Ville / Pays',
      type: 'string',
      hidden: ({ document }) => document?.type !== 'international',
    }),
    defineField({
      name: 'international_duration',
      title: 'Durée',
      type: 'string',
      description: 'Ex: 2 ans, 2020-2022',
      hidden: ({ document }) => document?.type !== 'international',
    }),
    defineField({
      name: 'international_why',
      title: 'Pourquoi cette destination ?',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'international',
    }),
    defineField({
      name: 'international_daily_life',
      title: 'Le quotidien là-bas',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'international',
    }),
    defineField({
      name: 'international_best_memory',
      title: 'Le meilleur souvenir',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'international',
    }),
    defineField({
      name: 'international_challenges',
      title: 'Les défis de l\'expatriation',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'international',
    }),

    // Questions spécifiques pour "Conseil & Mentorat"
    defineField({
      name: 'mentoring_topic',
      title: 'Sujet du conseil',
      type: 'string',
      description: 'Ex: Orientation, Réseau, Reconversion...',
      hidden: ({ document }) => document?.type !== 'mentoring',
    }),
    defineField({
      name: 'mentoring_context',
      title: 'Contexte',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'mentoring',
    }),
    defineField({
      name: 'mentoring_advice',
      title: 'Tes conseils',
      type: 'text',
      rows: 5,
      hidden: ({ document }) => document?.type !== 'mentoring',
    }),
    defineField({
      name: 'mentoring_mistakes',
      title: 'Les erreurs à éviter',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'mentoring',
    }),

    // Questions spécifiques pour "Projet & Réalisation"
    defineField({
      name: 'project_name',
      title: 'Nom du projet',
      type: 'string',
      hidden: ({ document }) => document?.type !== 'project',
    }),
    defineField({
      name: 'project_description',
      title: 'Description du projet',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'project',
    }),
    defineField({
      name: 'project_role',
      title: 'Ton rôle',
      type: 'text',
      rows: 3,
      hidden: ({ document }) => document?.type !== 'project',
    }),
    defineField({
      name: 'project_challenges',
      title: 'Les défis techniques/humains',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'project',
    }),
    defineField({
      name: 'project_outcome',
      title: 'Le résultat',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'project',
    }),
    defineField({
      name: 'project_learnings',
      title: 'Ce que tu en retiens',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.type !== 'project',
    }),

    // Champs communs
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
      description: 'Ex: #startup, #datascience, #expatriation',
    }),
    defineField({
      name: 'rating',
      title: 'Note d\'expérience',
      type: 'number',
      description: 'De 1 à 5 - Note globale de ton expérience',
      validation: (Rule) => Rule.min(1).max(5).integer(),
    }),
    defineField({
      name: 'status',
      title: 'Statut',
      type: 'string',
      options: {
        list: [
          { title: '📝 Brouillon', value: 'draft' },
          { title: '✅ Publié', value: 'published' },
          { title: '📦 Archivé', value: 'archived' },
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'likes',
      title: 'Likes',
      type: 'number',
      description: 'Nombre de likes (géré automatiquement)',
      initialValue: 0,
      readOnly: true,
    }),
    defineField({
      name: 'publishedAt',
      title: 'Date de publication',
      type: 'datetime',
      description: 'Date de publication du témoignage',
    }),
    defineField({
      name: 'createdAt',
      title: 'Date de création',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      type: 'type',
      authorFirstName: 'author.firstName',
      authorLastName: 'author.lastName',
      media: 'featuredImage',
      status: 'status',
    },
    prepare(selection) {
      const { title, type, authorFirstName, authorLastName, status } = selection
      const typeEmojis: Record<string, string> = {
        studies: '🎓',
        company: '💼',
        career: '🚀',
        international: '🌍',
        mentoring: '💡',
        project: '🎯',
      }
      const statusEmojis: Record<string, string> = {
        draft: '📝',
        published: '✅',
        archived: '📦',
      }
      return {
        title: `${typeEmojis[type] || ''} ${title}`,
        subtitle: `${authorFirstName} ${authorLastName} - ${statusEmojis[status] || status}`,
        media: selection.media,
      }
    },
  },
  orderings: [
    {
      title: 'Date de publication (récent)',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
    {
      title: 'Date de publication (ancien)',
      name: 'publishedAtAsc',
      by: [{ field: 'publishedAt', direction: 'asc' }],
    },
    {
      title: 'Plus populaires',
      name: 'likesDesc',
      by: [{ field: 'likes', direction: 'desc' }],
    },
    {
      title: 'Type',
      name: 'typeAsc',
      by: [{ field: 'type', direction: 'asc' }],
    },
  ],
})
