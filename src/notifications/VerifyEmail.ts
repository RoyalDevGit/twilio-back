import urlJoin from 'proper-url-join'

import {
  NotificationChannel,
  NotificationContentFormat,
  NotificationType,
  NotificationConfig,
  NotificationAudience,
} from 'models/NotificationConfig'
import { User } from 'models/User'
import { Env } from 'utils/env'
import { queueNotification } from 'utils/notifications/queueNotification'
import { createEmailVerificationToken } from 'utils/token/emailVerificationToken'

const APP_URL = Env.getString('APP_URL')

export interface VerifyEmailPayload {
  firstName: string
  verifyEmailUrl: string
}

const EMAIL_VERIFICATION_TEMPLATE_ID = Env.getString(
  'EMAIL_VERIFICATION_TEMPLATE_ID'
)
export const VerifyEmailConfig = new NotificationConfig({
  id: NotificationType.VerifyEmail,
  audience: NotificationAudience.All,
  allowOptOut: false,
  templates: [
    {
      subjectTemplateKey: 'verifyEmail.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_VERIFICATION_TEMPLATE_ID,
    },
  ],
})

interface QueueEmailVerificationNotification {
  user: User
}

export const queueEmailVerificationNotification = async ({
  user,
}: QueueEmailVerificationNotification) => {
  const emailVerificationToken = createEmailVerificationToken(user.emailAddress)
  const payload: VerifyEmailPayload = {
    firstName: user.firstName,
    verifyEmailUrl: urlJoin(
      APP_URL,
      `/api/auth/verify-email/${emailVerificationToken}`
    ),
  }
  return queueNotification({
    currentUser: user,
    targetUser: user,
    config: VerifyEmailConfig,
    payload,
  })
}
