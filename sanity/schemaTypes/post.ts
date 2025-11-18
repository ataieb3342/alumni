import { defineField, defineType } from 'sanity'

export const postType = defineType({
  name: 'post',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      validation: (Rule) => Rule.required(),
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
      name: 'mainImage',
      title: 'Image principale',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Texte alternatif',
        }
      ]
    }),
    defineField({
      name: 'publishedAt',
      title: 'Date de publication',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Extrait',
      type: 'text',
      rows: 4,
      description: 'Court résumé de l\'article (150-200 caractères)',
    }),
    defineField({
      name: 'visibility',
      title: 'Visibilité',
      type: 'string',
      options: {
        list: [
          { title: '🌍 Public', value: 'public' },
          { title: '🔒 Membres uniquement', value: 'members_only' },
        ],
        layout: 'radio',
      },
      initialValue: 'public',
      validation: (Rule) => Rule.required(),
      description: 'Qui peut voir cet article ?',
    }),
    defineField({
      name: 'body',
      title: 'Contenu',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'Citation', value: 'blockquote' },
          ],
          marks: {
            // Décorateurs de base
            decorators: [
              { title: 'Gras', value: 'strong' },
              { title: 'Italique', value: 'em' },
              { title: 'Souligné', value: 'underline' },
              { title: 'Barré', value: 'strike-through' },
              { title: 'Code', value: 'code' },
            ],
            // Annotations pour les liens - VERSION FLEXIBLE
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Lien',
                fields: [
                  {
                    name: 'href',
                    type: 'string', // ← CHANGEMENT IMPORTANT : string au lieu de url
                    title: 'URL ou email',
                    description: 'https://..., mailto:email@exemple.fr, tel:+33123456789, /page-interne, #ancre, etc.',
                    validation: (Rule) => Rule.required()
                  },
                  {
                    name: 'target',
                    type: 'string',
                    title: 'Cible',
                    options: {
                      list: [
                        { title: 'Même fenêtre', value: '' },
                        { title: 'Nouvel onglet', value: '_blank' },
                      ],
                      layout: 'radio'
                    },
                    initialValue: '_blank'
                  }
                ]
              }
            ]
          }
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'mainImage',
      subtitle: 'publishedAt',
    },
  },
})