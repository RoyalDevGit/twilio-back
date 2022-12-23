import { DateTime } from 'luxon'
import { serializeError } from 'serialize-error'

import { NotificationModel, NotificationStatus } from 'models/Notification'
import { notificationPopulationPaths } from 'repositories/notification/notificationPopulationPaths'
import { Env } from 'utils/env'
import { createLogger } from 'utils/logger/createLogger'
import { noticeError } from 'utils/newrelic/newrelic-utils'
import { dequeueNotification } from 'utils/notifications/dequeueNotification'

const NOTIFICATION_MAX_ATTEMPTS = Env.getNumber('NOTIFICATION_MAX_ATTEMPTS')

const logger = createLogger('notification-sender')

export const notificationSenderJob = async () => {
  try {
    logger.info('Getting queued notifications...')
    const queuedNotifications = await NotificationModel.find({
      status: NotificationStatus.Queued,
      attempts: { $lt: NOTIFICATION_MAX_ATTEMPTS },
      $and: [
        {
          $or: [{ immediate: false }, { immediate: { $exists: false } }],
        },
        {
          $or: [
            { sendAfter: { $lte: DateTime.now().toJSDate() } },
            { sendAfter: { $exists: false } },
          ],
        },
      ],
    }).populate(notificationPopulationPaths)

    logger.info(`${queuedNotifications.length} notification(s) found`)
    queuedNotifications.forEach((n) =>
      dequeueNotification({
        notification: n,
        logger,
      })
    )
  } catch (e) {
    noticeError(e)
    logger.error(serializeError(e))
  }
}
