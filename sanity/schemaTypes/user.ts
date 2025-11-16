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
          { title: 'Élève actuel', value: 'current_student' },
          { title: 'Ancien élève', value: 'alumni' },
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
      name: 'phone',
      title: 'Téléphone',
      type: 'string',
    }),
    defineField({
      name: 'promotionYear',
      title: 'Année de promotion',
      type: 'number',
      description: 'Année d\'obtention du bac ou de départ',
      hidden: ({ document }) => document?.userType === 'staff',
    }),
    defineField({
      name: 'currentStudies',
      title: 'Études actuelles',
      type: 'string',
      description: 'École/Université actuelle',
      hidden: ({ document }) => document?.userType === 'staff',
    }),
    defineField({
      name: 'currentJob',
      title: 'Poste actuel',
      type: 'string',
      hidden: ({ document }) => document?.userType !== 'alumni' && document?.userType !== 'staff',
    }),
    defineField({
      name: 'company',
      title: 'Entreprise',
      type: 'string',
      hidden: ({ document }) => document?.userType !== 'alumni' && document?.userType !== 'staff',
    }),
    defineField({
      name: 'linkedIn',
      title: 'LinkedIn',
      type: 'url',
    }),
    defineField({
      name: 'website',
      title: 'Site web',
      type: 'url',
      description: 'Site web personnel',
    }),
    defineField({
      name: 'github',
      title: 'GitHub',
      type: 'url',
      description: 'Profil GitHub',
    }),
    defineField({
      name: 'twitter',
      title: 'Twitter/X',
      type: 'url',
      description: 'Profil Twitter/X',
    }),
    defineField({
      name: 'facebook',
      title: 'Facebook',
      type: 'url',
      description: 'Profil Facebook',
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram',
      type: 'url',
      description: 'Profil Instagram',
    }),
    defineField({
      name: 'bio',
      title: 'Biographie',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Description courte',
    }),
    defineField({
      name: 'coverImage',
      title: 'Photo de couverture',
      type: 'image',
      description: 'Image de couverture du profil',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'currentCity',
      title: 'Ville actuelle',
      type: 'string',
      description: 'Ville de résidence actuelle',
    }),
    defineField({
      name: 'country',
      title: 'Pays',
      type: 'string',
      description: 'Pays de résidence',
    }),
    defineField({
      name: 'location',
      title: 'Localisation',
      type: 'string',
      description: 'Localisation géographique complète',
    }),
    defineField({
      name: 'birthDate',
      title: 'Date de naissance',
      type: 'date',
      description: 'Date de naissance',
    }),
    defineField({
      name: 'studyFields',
      title: 'Domaines d\'études',
      type: 'string',
      description: 'Domaines d\'études principaux',
    }),
    defineField({
      name: 'nickname',
      title: 'Pseudo',
      type: 'string',
      description: 'Nom d\'utilisateur unique',
    }),
    defineField({
      name: 'username',
      title: 'Nom d\'utilisateur',
      type: 'string',
      description: 'Nom d\'utilisateur pour connexion',
    }),
    defineField({
      name: 'language',
      title: 'Langue',
      type: 'string',
      description: 'Langue préférée (ex: fr_FR, en_US)',
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
      name: 'helloAssoMember',
      title: 'Adhésion HelloAsso',
      type: 'boolean',
      description: 'A adhéré via HelloAsso',
      initialValue: false,
    }),
    defineField({
      name: 'lastLogin',
      title: 'Dernière connexion',
      type: 'datetime',
      description: 'Date de dernière connexion',
    }),
    defineField({
      name: 'originalUserId',
      title: 'ID utilisateur d\'origine',
      type: 'number',
      description: 'ID de l\'ancien site pour référence',
      hidden: true,
    }),
    defineField({
      name: 'anneesLvh',
      title: 'Années au LVH (import)',
      type: 'string',
      description: 'Années passées au Lycée Victor Hugo (ex: 2014-2019)',
      hidden: true,
    }),
    defineField({
      name: 'ville_actuelle',
      title: 'Ville actuelle (import)',
      type: 'string',
      description: 'Champ d\'import depuis l\'ancien site',
      hidden: true,
    }),
    defineField({
      name: 'localisation',
      title: 'Localisation (import)',
      type: 'string',
      description: 'Champ d\'import depuis l\'ancien site',
      hidden: true,
    }),
    defineField({
      name: 'domainesEtudes',
      title: 'Domaines d\'études (import)',
      type: 'string',
      description: 'Champ d\'import depuis l\'ancien site',
      hidden: true,
    }),
    defineField({
      name: 'fullName',
      title: 'Nom complet (import)',
      type: 'string',
      description: 'Nom complet pour compatibilité import',
      hidden: true,
    }),
    defineField({
      name: 'isVisibleInDirectory',
      title: 'Visible dans l\'annuaire',
      type: 'boolean',
      initialValue: true,
      description: 'Si décoché, le profil ne sera pas visible dans l\'annuaire public',
    }),
    defineField({
      name: 'role',
      title: 'Rôle',
      type: 'string',
      options: {
        list: [
          { title: 'Membre', value: 'member' },
          { title: 'Administrateur', value: 'admin' },
        ],
        layout: 'radio',
      },
      initialValue: 'member',
      validation: (Rule) => Rule.required(),
      description: 'Rôle de l\'utilisateur dans l\'association',
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
        current_student: 'Élève',
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