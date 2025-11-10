import { defineField, defineType } from 'sanity'

export const activityLogType = defineType({
  name: 'activityLog',
  title: 'Journal d\'activité',
  type: 'document',
  fields: [
    defineField({
      name: 'user',
      title: 'Utilisateur',
      type: 'reference',
      to: [{ type: 'user' }],
      description: 'Utilisateur qui a effectué l\'action',
    }),
    defineField({
      name: 'action',
      title: 'Action',
      type: 'string',
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          { title: 'Connexion', value: 'login' },
          { title: 'Déconnexion', value: 'logout' },
          { title: 'Création de compte', value: 'signup' },
          { title: 'Mise à jour profil', value: 'profile_update' },
          { title: 'Publication annonce', value: 'announcement_create' },
          { title: 'Modification annonce', value: 'announcement_update' },
          { title: 'Suppression annonce', value: 'announcement_delete' },
          { title: 'Consultation profil', value: 'profile_view' },
          { title: 'Consultation annonce', value: 'announcement_view' },
          { title: 'Lecture article blog', value: 'blog_view' },
          { title: 'Abonnement newsletter', value: 'newsletter_subscribe' },
          { title: 'Désabonnement newsletter', value: 'newsletter_unsubscribe' },
          { title: 'Export données', value: 'data_export' },
          { title: 'Changement mot de passe', value: 'password_change' },
          { title: 'Réinitialisation mot de passe', value: 'password_reset' },
        ],
      },
      description: 'Type d\'action effectuée',
    }),
    defineField({
      name: 'resource',
      title: 'Ressource',
      type: 'string',
      description: 'Type de ressource concernée (user, announcement, post, etc.)',
    }),
    defineField({
      name: 'resourceId',
      title: 'ID de la ressource',
      type: 'string',
      description: 'ID de la ressource concernée',
    }),
    defineField({
      name: 'details',
      title: 'Détails',
      type: 'text',
      description: 'Détails supplémentaires de l\'action',
    }),
    defineField({
      name: 'ipAddress',
      title: 'Adresse IP',
      type: 'string',
      description: 'Adresse IP de l\'utilisateur',
    }),
    defineField({
      name: 'userAgent',
      title: 'User Agent',
      type: 'string',
      description: 'User Agent du navigateur',
    }),
    defineField({
      name: 'timestamp',
      title: 'Date et heure',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      action: 'action',
      firstName: 'user.firstName',
      lastName: 'user.lastName',
      timestamp: 'timestamp',
      resource: 'resource',
    },
    prepare({ action, firstName, lastName, timestamp, resource }) {
      const actionLabels: Record<string, string> = {
        login: 'Connexion',
        logout: 'Déconnexion',
        signup: 'Création de compte',
        profile_update: 'Mise à jour profil',
        announcement_create: 'Publication annonce',
        announcement_update: 'Modification annonce',
        announcement_delete: 'Suppression annonce',
        profile_view: 'Consultation profil',
        announcement_view: 'Consultation annonce',
        blog_view: 'Lecture article blog',
        newsletter_subscribe: 'Abonnement newsletter',
        newsletter_unsubscribe: 'Désabonnement newsletter',
        data_export: 'Export données',
        password_change: 'Changement mot de passe',
        password_reset: 'Réinitialisation mot de passe',
      }

      const userName = firstName && lastName ? `${firstName} ${lastName}` : 'Utilisateur inconnu'
      const date = timestamp ? new Date(timestamp).toLocaleString('fr-FR') : ''

      return {
        title: `${actionLabels[action] || action} - ${userName}`,
        subtitle: `${date}${resource ? ` - ${resource}` : ''}`,
      }
    },
  },
})
