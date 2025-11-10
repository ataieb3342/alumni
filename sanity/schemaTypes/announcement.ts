import { defineField, defineType } from 'sanity'

export const announcementType = defineType({
  name: 'announcement',
  title: 'Annonce',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
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
      title: "Type d'annonce",
      type: 'string',
      options: {
        list: [
          { title: "Offre d'emploi", value: 'job_offer' },
          { title: 'Stage', value: 'internship' },
          { title: 'Opportunité', value: 'opportunity' },
          { title: 'Événement', value: 'event' },
          { title: 'Vente matos scolaire', value: 'school_supplies' },
          { title: 'Autre', value: 'other' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'company',
      title: 'Entreprise',
      type: 'string',
      description: "Nom de l'entreprise ou de l'organisation",
    }),
    defineField({
      name: 'location',
      title: 'Localisation',
      type: 'string',
      description: 'Ville, région ou "Remote"',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Number', value: 'number' },
          ],
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'contactEmail',
      title: 'Email de contact',
      type: 'string',
      description: 'Email pour postuler ou obtenir plus d\'informations',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'contactPhone',
      title: 'Téléphone de contact',
      type: 'string',
    }),
    defineField({
      name: 'externalLink',
      title: 'Lien externe',
      type: 'url',
      description: 'Lien vers une page de candidature ou plus d\'infos',
    }),
    defineField({
      name: 'author',
      title: 'Auteur',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
      description: 'Membre ayant publié cette annonce',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Date de publication',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'expiresAt',
      title: "Date d'expiration",
      type: 'datetime',
      description: "Après cette date, l'annonce ne sera plus visible",
    }),
    defineField({
      name: 'status',
      title: 'Statut',
      type: 'string',
      options: {
        list: [
          { title: 'Brouillon', value: 'draft' },
          { title: 'Publiée', value: 'published' },
          { title: 'Archivée', value: 'archived' },
        ],
        layout: 'radio',
      },
      initialValue: 'published',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      company: 'company',
      type: 'type',
      author: 'author.firstName',
      status: 'status',
    },
    prepare({ title, company, type, author, status }) {
      const typeLabels: Record<string, string> = {
        job_offer: '💼 Emploi',
        internship: '🎓 Stage',
        opportunity: '✨ Opportunité',
        event: '📅 Événement',
        school_supplies: '📚 Vente matos',
        other: '📢 Autre',
      }
      const statusEmoji: Record<string, string> = {
        draft: '📝',
        published: '✅',
        archived: '📦',
      }
      return {
        title: `${statusEmoji[status] || ''} ${title}`,
        subtitle: `${typeLabels[type] || type} ${company ? `- ${company}` : ''}`,
      }
    },
  },
  orderings: [
    {
      title: 'Date de publication (plus récent)',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
    {
      title: 'Date de publication (plus ancien)',
      name: 'publishedAtAsc',
      by: [{ field: 'publishedAt', direction: 'asc' }],
    },
    {
      title: 'Type',
      name: 'typeAsc',
      by: [{ field: 'type', direction: 'asc' }],
    },
  ],
})
