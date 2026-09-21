import { postType } from './post'
import { userType } from './user'
import { announcementType } from './announcement'
import { newsletterSubscriptionType } from './newsletterSubscription'
import passwordResetToken from './passwordResetToken'
import { testimonial } from './testimonial'
import activityLog from './activityLog'

export const schema = {
  types: [
    userType,
    postType,
    announcementType,
    newsletterSubscriptionType,
    passwordResetToken,
    testimonial,
    activityLog,
  ],
}