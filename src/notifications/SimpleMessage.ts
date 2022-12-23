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

const EMAIL_SIMPLE_MESSAGE_TEMPLATE_ID = Env.getString(
  'EMAIL_SIMPLE_MESSAGE_TEMPLATE_ID'
)

interface SimpleMessagePayload {
  firstName: string
}

export const SimpleMessageConfig = new NotificationConfig({
  id: NotificationType.SimpleMessage,
  audience: NotificationAudience.All,
  allowOptOut: false,
  templates: [
    {
      subjectTemplateKey: 'simpleMessage.subject',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
        NotificationChannel.Email,
        NotificationChannel.SMS,
      ],
      bodyTemplateKey: 'simpleMessage.body',
      externalBodyTemplateId: EMAIL_SIMPLE_MESSAGE_TEMPLATE_ID,
    },
  ],
})

export const queueSimpleNotification = async (targetUser: User) => {
  const payload: SimpleMessagePayload = {
    firstName: targetUser.firstName,
  }
  return queueNotification({
    currentUser: targetUser,
    targetUser,
    config: SimpleMessageConfig,
    payload,
  })
}
