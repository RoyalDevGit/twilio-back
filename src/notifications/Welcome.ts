import {
  NotificationChannel,
  NotificationContentFormat,
  NotificationType,
  NotificationConfig,
  NotificationAudience,
} from 'models/NotificationConfig'
import { User, UserRole } from 'models/User'
import { Env } from 'utils/env'
import { queueNotification } from 'utils/notifications/queueNotification'

const APP_DOWNLOAD_URL = Env.getString('APP_DOWNLOAD_URL')

export interface WelcomeConsumerPayload {
  firstName: string
  downloadAppUrl: string
}

const EMAIL_WELCOME_CONSUMER_TEMPLATE_ID = Env.getString(
  'EMAIL_WELCOME_CONSUMER_TEMPLATE_ID'
)

export const WelcomeConsumerConfig = new NotificationConfig({
  id: NotificationType.Welcome,
  audience: NotificationAudience.Consumer,
  allowOptOut: false,
  templates: [
    {
      subjectTemplateKey: 'welcome.consumer.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_WELCOME_CONSUMER_TEMPLATE_ID,
    },
    {
      bodyTemplateKey: 'welcome.consumer.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

export interface WelcomeExpertPayload {
  firstName: string
  downloadAppUrl: string
}

const EMAIL_WELCOME_EXPERT_TEMPLATE_ID = Env.getString(
  'EMAIL_WELCOME_EXPERT_TEMPLATE_ID'
)

export const WelcomeExpertConfig = new NotificationConfig({
  id: NotificationType.Welcome,
  audience: NotificationAudience.Expert,
  allowOptOut: false,
  templates: [
    {
      subjectTemplateKey: 'welcome.expert.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_WELCOME_EXPERT_TEMPLATE_ID,
    },
    {
      quiet: true,
      bodyTemplateKey: 'welcome.expert.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

interface QueueWelcomeNotificationOptions {
  user: User
}

export const queueWelcomeNotification = ({
  user,
}: QueueWelcomeNotificationOptions) => {
  if (user.roles.includes(UserRole.Expert)) {
    const expertPayload: WelcomeConsumerPayload = {
      firstName: user.firstName,
      downloadAppUrl: APP_DOWNLOAD_URL,
    }

    return queueNotification({
      currentUser: user,
      targetUser: user,
      config: WelcomeExpertConfig,
      payload: expertPayload,
    })
  }

  const consumerPayload: WelcomeConsumerPayload = {
    firstName: user.firstName,
    downloadAppUrl: APP_DOWNLOAD_URL,
  }

  return queueNotification({
    currentUser: user,
    targetUser: user,
    config: WelcomeConsumerConfig,
    payload: consumerPayload,
  })
}
