import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'alumniEmailLog',
  title: 'Emails Alumni envoyés',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
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
      name: 'sentAt',
      title: 'Envoyé le',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      email: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
      sentAt: 'sentAt',
    },
    prepare({ email, firstName, lastName, sentAt }) {
      return {
        title: `${firstName} ${lastName}`,
        subtitle: `${email} - ${new Date(sentAt).toLocaleDateString('fr-FR')}`,
      }
    },
  },
})
