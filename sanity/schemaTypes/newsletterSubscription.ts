import { defineField, defineType } from 'sanity'

export const newsletterSubscriptionType = defineType({
  name: 'newsletterSubscription',
  title: 'Abonnement Newsletter',
  type: 'document',
  fields: [
    defineField({
      name: 'user',
      title: 'Utilisateur',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
      description: 'Utilisateur abonné aux newsletters',
    }),
    defineField({
      name: 'generalNewsletter',
      title: 'Newsletter générale',
      type: 'boolean',
      initialValue: true,
      description: 'Newsletter périodique de l\'association',
    }),
    defineField({
      name: 'announcementsNewsletter',
      title: 'Notifications annonces',
      type: 'boolean',
      initialValue: false,
      description: 'Email automatique à chaque nouvelle annonce publiée',
    }),
    defineField({
      name: 'subscribedAt',
      title: 'Date d\'inscription',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
    defineField({
      name: 'updatedAt',
      title: 'Dernière mise à jour',
      type: 'datetime',
      description: 'Dernière modification des préférences',
    }),
  ],
  preview: {
    select: {
      firstName: 'user.firstName',
      lastName: 'user.lastName',
      email: 'user.email',
      generalNewsletter: 'generalNewsletter',
      announcementsNewsletter: 'announcementsNewsletter',
    },
    prepare({ firstName, lastName, email, generalNewsletter, announcementsNewsletter }) {
      const subscriptions = []
      if (generalNewsletter) subscriptions.push('📧 Générale')
      if (announcementsNewsletter) subscriptions.push('📢 Annonces')

      return {
        title: `${firstName} ${lastName}`,
        subtitle: subscriptions.length > 0
          ? subscriptions.join(', ')
          : 'Aucun abonnement',
        description: email,
      }
    },
  },
})
