import { defineType } from 'sanity'

export default defineType({
  name: 'passwordResetToken',
  title: 'Token de réinitialisation de mot de passe',
  type: 'document',
  fields: [
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    },
    {
      name: 'token',
      title: 'Token',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'expiresAt',
      title: 'Date d\'expiration',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'used',
      title: 'Utilisé',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'createdAt',
      title: 'Créé le',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },
  ],
})
