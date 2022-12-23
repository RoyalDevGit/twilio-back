import { NotificationConfig } from 'models/NotificationConfig'
import { NotificationUserPreferenceModel } from 'models/NotificationUserPreference'
import { User } from 'models/User'

export const getUserNotificationPreference = async (
  user: User,
  notificationTemplate: NotificationConfig
) => {
  if (!notificationTemplate.allowOptOut)
    return notificationTemplate.getChannels()

  const findPreference = await NotificationUserPreferenceModel.findOne({
    userId: user.id,
    notificationType: notificationTemplate.id,
  })

  if (!findPreference) {
    return notificationTemplate.getChannels()
  }

  return findPreference.channels
}
