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
