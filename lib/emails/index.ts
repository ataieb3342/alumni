// Export de la configuration
export { transporter } from './config'

// Export des fonctions d'emails avec les nouveaux noms
export { sendAdminNewUserNotification } from './admin-new-user-notification'
export { sendUserAccountValidated } from './user-account-validated'
export { sendUserPasswordReset } from './user-password-reset'
export { sendMarketingCommunityInvitationAlumni } from './marketing-community-invitation-alumni'
export { sendMarketingCommunityInvitationStudents } from './marketing-community-invitation-students'
export { sendMarketingMigratedUsersWelcome } from './marketing-migrated-users-welcome'
export { sendMarketingMembersCreateAccount } from './marketing-members-create-account'
export { sendMarketingAlumniWelcome } from './marketing-alumni-welcome'

// Exports avec les anciens noms pour la rétrocompatibilité (à supprimer plus tard)
export { sendAdminNewUserNotification as sendAdminNotificationEmail } from './admin-new-user-notification'
export { sendUserAccountValidated as sendAccountValidatedEmail } from './user-account-validated'
export { sendUserPasswordReset as sendPasswordResetEmail } from './user-password-reset'
