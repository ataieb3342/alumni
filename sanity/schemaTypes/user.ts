import { defineField, defineType } from 'sanity'

export const userType = defineType({
  name: 'user',
  title: 'Utilisateur',
  type: 'document',
  fields: [
    defineField({
      name: 'firstName',
      title: 'Prénom',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lastName',
      title: 'Nom',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'password',
      title: 'Mot de passe (hashé)',
      type: 'string',
      hidden: true, // Caché dans le studio
    }),
    defineField({
      name: 'oauthProvider',
      title: 'Provider OAuth',
      type: 'string',
      description: 'Provider OAuth utilisé (google, linkedin)',
      options: {
        list: [
          { title: 'Google', value: 'google' },
          { title: 'LinkedIn', value: 'linkedin' },
        ],
      },
      hidden: true,
    }),
    defineField({
      name: 'oauthId',
      title: 'ID OAuth',
      type: 'string',
      description: 'ID du compte OAuth',
      hidden: true,
    }),
    defineField({
      name: 'linkedInProfile',
      title: 'Profil LinkedIn (données brutes)',
      type: 'object',
      description: 'Données du profil LinkedIn pour mapping',
      fields: [
        { name: 'raw', title: 'Données brutes', type: 'text' }
      ],
      hidden: true,
    }),
    defineField({
      name: 'googleProfile',
      title: 'Profil Google (données brutes)',
      type: 'object',
      description: 'Données du profil Google pour mapping',
      fields: [
        { name: 'raw', title: 'Données brutes', type: 'text' }
      ],
      hidden: true,
    }),
    defineField({
      name: 'userType',
      title: 'Type de membre',
      type: 'string',
      options: {
        list: [
          { title: 'Lycéen', value: 'lyceen' },
          { title: 'BTS', value: 'bts' },
          { title: 'Prépa', value: 'prepa' },
          { title: 'Ancien élève (Alumni)', value: 'alumni' },
          { title: 'Personnel', value: 'staff' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'profileImage',
      title: 'Photo de profil',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'promotionYear',
      title: 'Année du baccalauréat',
      type: 'number',
      description: 'Année d\'obtention du baccalauréat (ou année prévue)',
      hidden: ({ document }) => document?.userType === 'staff' || document?.userType === 'lyceen',
    }),
    defineField({
      name: 'currentStudies',
      title: 'Études actuelles',
      type: 'string',
      description: 'École/Université actuelle ou classe actuelle',
      hidden: ({ document }) => document?.userType === 'staff' || document?.userType === 'alumni',
    }),
    defineField({
      name: 'linkedIn',
      title: 'LinkedIn',
      type: 'string',
      description: 'URL de votre profil LinkedIn (avec ou sans https://)',
      placeholder: 'https://linkedin.com/in/votre-nom ou www.linkedin.com/in/votre-nom',
      hidden: ({ document }) => document?.userType === 'lyceen',
    }),
    defineField({
      name: 'bio',
      title: 'Biographie',
      type: 'text',
      rows: 4,
      hidden: ({ document }) => document?.userType === 'lyceen',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Description courte',
      hidden: ({ document }) => document?.userType === 'lyceen',
    }),
    defineField({
      name: 'coverImage',
      title: 'Photo de couverture',
      type: 'image',
      description: 'Image de couverture du profil',
      options: {
        hotspot: true,
      },
      hidden: ({ document }) => document?.userType === 'lyceen',
    }),
    defineField({
      name: 'education',
      title: 'Formations',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'school',
              title: 'École/Université',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'degree',
              title: 'Diplôme',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'field',
              title: 'Domaine d\'études',
              type: 'string',
            },
            {
              name: 'startYear',
              title: 'Année de début',
              type: 'number',
              validation: (Rule) => Rule.required().min(1950).max(2100),
            },
            {
              name: 'endYear',
              title: 'Année de fin',
              type: 'number',
              validation: (Rule) => Rule.min(1950).max(2100),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 3,
            },
          ],
          preview: {
            select: {
              school: 'school',
              degree: 'degree',
              startYear: 'startYear',
              endYear: 'endYear',
            },
            prepare({ school, degree, startYear, endYear }) {
              return {
                title: `${degree} - ${school}`,
                subtitle: endYear ? `${startYear} - ${endYear}` : `${startYear} - En cours`,
              }
            },
          },
        },
      ],
      description: 'Liste des formations et diplômes obtenus',
      hidden: ({ document }) => document?.userType === 'lyceen',
    }),
    defineField({
      name: 'experience',
      title: 'Expériences professionnelles',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'company',
              title: 'Entreprise',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'position',
              title: 'Poste',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'location',
              title: 'Lieu',
              type: 'string',
            },
            {
              name: 'startDate',
              title: 'Date de début',
              type: 'date',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'endDate',
              title: 'Date de fin',
              type: 'date',
              description: 'Laisser vide si c\'est le poste actuel',
            },
            {
              name: 'current',
              title: 'Poste actuel',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 4,
            },
          ],
          preview: {
            select: {
              company: 'company',
              position: 'position',
              startDate: 'startDate',
              endDate: 'endDate',
              current: 'current',
            },
            prepare({ company, position, startDate, endDate, current }) {
              const start = startDate ? new Date(startDate).getFullYear() : ''
              const end = current ? 'Présent' : (endDate ? new Date(endDate).getFullYear() : '')
              return {
                title: `${position} - ${company}`,
                subtitle: `${start} - ${end}`,
              }
            },
          },
        },
      ],
      description: 'Liste des expériences professionnelles',
      hidden: ({ document }) => document?.userType === 'lyceen',
    }),
    defineField({
      name: 'roleAssociation',
      title: 'Rôles dans l\'association',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Président(e)', value: 'president' },
          { title: 'Vice-président(e)', value: 'vice_president' },
          { title: 'Trésorier(e)', value: 'tresorier' },
          { title: 'Secrétaire général(e)', value: 'secretaire_general' },
          { title: 'Responsable communication', value: 'resp_communication' },
          { title: 'Responsable événementiel', value: 'resp_evenementiel' },
          { title: 'Responsable informatique', value: 'resp_informatique' },
          { title: 'Responsable mailing list', value: 'resp_mailing' },
          { title: 'Pôle communication', value: 'pole_communication' },
          { title: 'Pôle informatique', value: 'pole_informatique' },
        ],
      },
      description: 'Rôles dans l\'association des anciens élèves',
    }),
    defineField({
      name: 'personnelMetier',
      title: 'Métier (pour personnel)',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Métier pour le personnel du lycée',
      hidden: ({ document }) => document?.userType !== 'staff',
    }),
    defineField({
      name: 'isVisibleInDirectory',
      title: 'Visible dans l\'annuaire',
      type: 'boolean',
      initialValue: true,
      description: 'Si décoché, le profil ne sera pas visible dans l\'annuaire public',
    }),
    defineField({
      name: 'accountStatus',
      title: 'Statut du compte',
      type: 'string',
      options: {
        list: [
          { title: 'Actif', value: 'active' },
          { title: 'En attente de validation', value: 'pending' },
          { title: 'Suspendu', value: 'suspended' },
          { title: 'Inactif', value: 'inactive' },
        ],
        layout: 'radio',
      },
      initialValue: 'active',
      validation: (Rule) => Rule.required(),
      description: 'État du compte utilisateur',
    }),
    defineField({
      name: 'validationEmailSentAt',
      title: 'Email de validation envoyé',
      type: 'datetime',
      description: 'Date à laquelle l\'email de validation a été envoyé (automatique)',
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: 'createdAt',
      title: 'Date d\'inscription',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      firstName: 'firstName',
      lastName: 'lastName',
      userType: 'userType',
      media: 'profileImage',
    },
    prepare({ firstName, lastName, userType, media }) {
      const typeLabels: Record<string, string> = {
        lyceen: 'Lycéen',
        bts: 'BTS',
        prepa: 'Prépa',
        alumni: 'Alumni',
        staff: 'Personnel',
      }
      return {
        title: `${firstName} ${lastName}`,
        subtitle: typeLabels[userType] || userType,
        media,
      }
    },
  },
})