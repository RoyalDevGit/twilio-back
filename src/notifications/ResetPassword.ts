import urlJoin from 'proper-url-join'

import {
  NotificationChannel,
  NotificationContentFormat,
  NotificationType,
  NotificationConfig,
  NotificationAudience,
} from 'models/NotificationConfig'
import { User } from 'models/User'
import { queueNotification } from 'utils/notifications/queueNotification'
import { Env } from 'utils/env'
import { createResetPasswordToken } from 'utils/token/resetPasswordToken'

export interface ResetPasswordPayload {
  firstName: string
  resetPasswordUrl: string
  expiresIn: string
}

const APP_URL = Env.getString('APP_URL')

const EMAIL_RESET_PASSWORD_TEMPLATE_ID = Env.getString(
  'EMAIL_RESET_PASSWORD_TEMPLATE_ID'
)
const RESET_PASSWORD_JWT_EXPIRES_IN = Env.getString(
  'RESET_PASSWORD_JWT_EXPIRES_IN'
)

export const ResetPasswordConfig = new NotificationConfig({
  id: NotificationType.ResetPassword,
  audience: NotificationAudience.All,
  allowOptOut: false,
  templates: [
    {
      subjectTemplateKey: 'resetPassword.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_RESET_PASSWORD_TEMPLATE_ID,
    },
  ],
})

interface SendPasswordResetLinkOptions {
  user: User
}

export const sendPasswordResetLink = async ({
  user,
}: SendPasswordResetLinkOptions) => {
  const resetPasswordToken = createResetPasswordToken(user.emailAddress)
  const payload: ResetPasswordPayload = {
    firstName: user.firstName,
    resetPasswordUrl: urlJoin(
      APP_URL,
      `/reset-password?token=${encodeURIComponent(resetPasswordToken)}`
    ),
    expiresIn: RESET_PASSWORD_JWT_EXPIRES_IN,
  }
  console.log(payload)
  await queueNotification({
    currentUser: user,
    immediate: true,
    targetUser: user,
    config: ResetPasswordConfig,
    payload,
  })
}
