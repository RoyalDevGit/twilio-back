import { DateTime } from 'luxon'

import {
  Notification,
  NotificationModel,
  NotificationStatus,
} from 'models/Notification'
import { NotificationConfig, TemplateConfig } from 'models/NotificationConfig'
import { User } from 'models/User'
import { getUserNotificationPreference } from 'repositories/notification/getUserNotificationPreference'
import { dequeueNotification } from 'utils/notifications/dequeueNotification'

interface QueueNotificationOptions {
  currentUser: User
  targetUser: User
  referencedUser?: User
  config: NotificationConfig
  payload: object
  sendAfter?: DateTime
  immediate?: boolean
}

export const queueNotification = async ({
  currentUser,
  targetUser,
  config,
  payload = {},
  sendAfter,
  referencedUser,
  immediate,
}: QueueNotificationOptions) => {
  const userPreferences = await getUserNotificationPreference(
    targetUser,
    config
  )

  const newNotifications: Notification[] = []

  config.templates.forEach((templateConfig: TemplateConfig) => {
    if (
      templateConfig.preventSelfNotifications &&
      currentUser.id === targetUser.id
    ) {
      return
    }
    templateConfig.channels.forEach((channel) => {
      if (userPreferences.includes(channel)) {
        const newNotification = new NotificationModel({
          targetUser,
          notificationType: config.id,
          audience: config.audience,
          status: NotificationStatus.Queued,
          channel,
          payload,
          sendAfter,
          templateConfig,
          immediate,
          referencedUser,
          createdBy: currentUser.id,
        })

        newNotifications.push(newNotification)
      }
    })
  })

  if (newNotifications.length) {
    await NotificationModel.insertMany(newNotifications)
  }

  if (immediate) {
    newNotifications.forEach((n) =>
      dequeueNotification({
        notification: n,
      })
    )
  }

  return newNotifications
}
