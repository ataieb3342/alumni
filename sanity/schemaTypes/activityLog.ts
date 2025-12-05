import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'activityLog',
  title: 'Activity Log',
  type: 'document',
  fields: [
    defineField({
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{type: 'user'}],
      description: 'User who performed the action (optional for anonymous actions)',
    }),
    defineField({
      name: 'action',
      title: 'Action',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Type of action performed (e.g., login, page_visit, logout)',
    }),
    defineField({
      name: 'resource',
      title: 'Resource',
      type: 'string',
      description: 'Resource affected by the action (e.g., page path, document type)',
    }),
    defineField({
      name: 'resourceId',
      title: 'Resource ID',
      type: 'string',
      description: 'ID of the affected resource',
    }),
    defineField({
      name: 'details',
      title: 'Details',
      type: 'text',
      description: 'Additional details about the action',
    }),
    defineField({
      name: 'ipAddress',
      title: 'IP Address',
      type: 'string',
      description: 'IP address of the user',
    }),
    defineField({
      name: 'userAgent',
      title: 'User Agent',
      type: 'string',
      description: 'Browser user agent string',
    }),
    defineField({
      name: 'timestamp',
      title: 'Timestamp',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
      initialValue: () => new Date().toISOString(),
    }),
  ],
  orderings: [
    {
      title: 'Timestamp (newest first)',
      name: 'timestampDesc',
      by: [{field: 'timestamp', direction: 'desc'}],
    },
    {
      title: 'Timestamp (oldest first)',
      name: 'timestampAsc',
      by: [{field: 'timestamp', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      action: 'action',
      timestamp: 'timestamp',
      resource: 'resource',
      userEmail: 'user.email',
    },
    prepare({action, timestamp, resource, userEmail}) {
      const date = timestamp ? new Date(timestamp).toLocaleString('fr-FR') : 'No date'
      const userInfo = userEmail ? userEmail : 'Anonymous'
      const resourceInfo = resource ? ` - ${resource}` : ''

      return {
        title: `${action}${resourceInfo}`,
        subtitle: `${userInfo} • ${date}`,
      }
    },
  },
})
