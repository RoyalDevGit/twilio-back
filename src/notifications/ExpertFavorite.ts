import urlJoin from 'proper-url-join'
import { DateTime } from 'luxon'

import {
  NotificationChannel,
  NotificationContentFormat,
  NotificationType,
  NotificationConfig,
  NotificationAudience,
} from 'models/NotificationConfig'
import { Env } from 'utils/env'
import { getUserAvatarUrl } from 'utils/url/getUserAvatarUrl'
import { queueNotification } from 'utils/notifications/queueNotification'
import { Expert } from 'models/Expert'
import { User } from 'models/User'

export interface ExpertFavoritePayload {
  firstName: string
  consumerFullName: string
  consumerFirstName: string
  consumerProfileImageUrl?: string
  consumerLocation?: string
  sessionDate: string
  sessionTime: string
  sessionDetailsPageUrl: string
  sendAMessageUrl: string
}

const APP_URL = Env.getString('APP_URL')
const EMAIL_EXPERT_NEW_FOLLOWER_TEMPLATE_ID = Env.getString(
  'EMAIL_EXPERT_NEW_FOLLOWER_TEMPLATE_ID'
)

export const ExpertFavoriteConfig = new NotificationConfig({
  id: NotificationType.ExpertFollow,
  audience: NotificationAudience.Expert,
  allowOptOut: true,
  templates: [
    {
      subjectTemplateKey: 'newExpertFavorite.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_EXPERT_NEW_FOLLOWER_TEMPLATE_ID,
    },
    {
      bodyTemplateKey: 'newExpertFavorite.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

export interface QueueExpertFavoriteNotification {
  currentUser: User
  expert: Expert
  consumer: User
}

export const queueExpertFavoriteNotification = async ({
  currentUser,
  expert,
  consumer,
}: QueueExpertFavoriteNotification) => {
  const profileImage = await getUserAvatarUrl(consumer)

  const expertUser = expert.user as User

  const payload: ExpertFavoritePayload = {
    firstName: expertUser.firstName,
    consumerFullName: `${consumer.firstName} ${consumer.lastName}`,
    consumerFirstName: consumer.firstName,
    sessionDetailsPageUrl: urlJoin(APP_URL, '/schedule/sessions'),
    sessionDate: DateTime.now().toFormat('DDDD'),
    sessionTime: DateTime.now().toFormat('t z'),
    sendAMessageUrl: urlJoin(APP_URL, '/messages/'),
  }

  if (profileImage) {
    payload.consumerProfileImageUrl = profileImage
  }

  if (consumer.location) {
    payload.consumerLocation = consumer.location
  }

  await queueNotification({
    currentUser,
    targetUser: expert.user,
    referencedUser: consumer,
    config: ExpertFavoriteConfig,
    payload,
  })
}
