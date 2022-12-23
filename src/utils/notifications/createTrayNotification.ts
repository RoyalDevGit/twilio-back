import { getNotificationTFunction } from 'middleware/i18nMiddleware'
import { Language } from 'models/Language'
import { Notification, NotificationStatus } from 'models/Notification'
import {
  NotificationAudience,
  NotificationContentFormat,
  NotificationType,
} from 'models/NotificationConfig'
import { User } from 'models/User'

export interface TrayNotification {
  id: string
  notificationType: NotificationType
  audience: NotificationAudience
  status: NotificationStatus
  contentFormat: NotificationContentFormat
  createdAt: Date
  message: string
  referencedUser?: User
  payload: object
  quiet: boolean
}

export const createTrayNotification = async (
  targetUser: User,
  notification: Notification
): Promise<TrayNotification> => {
  const language = targetUser.settings.language as Language | undefined
  const t = await getNotificationTFunction(language?.code)
  const { templateConfig, payload } = notification

  let message = ''

  if (templateConfig.bodyTemplateKey) {
    message = t(templateConfig.bodyTemplateKey, payload)
  }

  const trayNotification: TrayNotification = {
    id: notification._id,
    notificationType: notification.notificationType,
    audience: notification.audience,
    status: notification.status,
    contentFormat: templateConfig.contentFormat,
    quiet: !!templateConfig.quiet,
    createdAt: notification.createdAt,
    message,
    payload,
    referencedUser: notification.referencedUser as User,
  }

  return trayNotification
}
