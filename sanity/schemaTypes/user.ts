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
      name: 'bio',
      title: 'Biographie',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'isVisibleInDirectory',
      title: 'Visible dans l\'annuaire',
      type: 'boolean',
      initialValue: true,
      description: 'Si décoché, le profil ne sera pas visible dans l\'annuaire public',
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