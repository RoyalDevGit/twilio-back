import urlJoin from 'proper-url-join'
import { DateTime } from 'luxon'
import { TFunction } from 'i18next'
import winston from 'winston'
import { serializeError } from 'serialize-error'

import { User } from 'models/User'
import { Notification, NotificationStatus } from 'models/Notification'
import { sendSMS } from 'apis/AwsSNS'
import { NotificationChannel } from 'models/NotificationConfig'
import { sendSgEmail } from 'apis/SendGrid'
import { emitToUser } from 'sockets/userIO'
import { joinPhoneNumber } from 'utils/string/joinPhoneNumber'
import { Env } from 'utils/env'
import { getUserById } from 'repositories/user/getUserById'
import { getNotificationTFunction } from 'middleware/i18nMiddleware'
import { Language } from 'models/Language'
import { createTrayNotification } from 'utils/notifications/createTrayNotification'
import { noticeError } from 'utils/newrelic/newrelic-utils'

const NOTIFICATION_MAX_ATTEMPTS = Env.getNumber('NOTIFICATION_MAX_ATTEMPTS')
const APP_URL = Env.getString('APP_URL')

interface CommonNotificationPayload {
  corpSiteUrl: string
  copyrightYear: string
  termsAndConditionsUrl: string
  privacyPolicyUrl: string
  facebookUrl: string
  twitterUrl: string
  instagramUrl: string
  youtubeUrl: string
  managePreferencesLink: string
  unsubscribeUrl: string
}

interface SendNotificationOptions {
  t: TFunction
  targetUser: User
  notification: Notification
  payload: object
}

const sendToTray = async ({
  targetUser,
  notification,
}: SendNotificationOptions) => {
  const trayNotification = await createTrayNotification(
    targetUser,
    notification
  )
  trayNotification.status = NotificationStatus.Sent
  emitToUser(targetUser, 'notificationCreated', trayNotification)
}

const sendToEmail = async ({
  t,
  targetUser,
  notification,
  payload,
}: SendNotificationOptions) => {
  const { templateConfig } = notification
  if (
    !templateConfig.externalBodyTemplateId ||
    !templateConfig.subjectTemplateKey
  ) {
    throw new Error(
      'Both externalBodyTemplateId and subjectTemplateKey are required to send email'
    )
  }
  const subject = t(templateConfig.subjectTemplateKey, payload)
  await sendSgEmail({
    targetUser,
    subject,
    templateId: templateConfig.externalBodyTemplateId,
    dynamicTemplateData: payload,
  })
}

export const sendToSMS = async ({
  t,
  targetUser,
  notification,
  payload,
}: SendNotificationOptions) => {
  const { templateConfig } = notification
  if (!targetUser.mobilePhoneNumber) {
    return
  }
  if (!targetUser.mobilePhoneNumber || !templateConfig.bodyTemplateKey) {
    throw new Error('bodyTemplateKey is required to send SMS')
  }
  const message = t(templateConfig.bodyTemplateKey, payload)
  await sendSMS(joinPhoneNumber(targetUser.mobilePhoneNumber), message)
}

interface DequeueNotificationOptions {
  notification: Notification
  logger?: winston.Logger
}

export const dequeueNotification = async ({
  notification,
  logger,
}: DequeueNotificationOptions) => {
  try {
    notification.attempts = notification.attempts + 1
    const targetUser = await getUserById(notification.targetUser as string)

    if (!targetUser) {
      return
    }

    const commonPayload: CommonNotificationPayload = {
      corpSiteUrl: APP_URL,
      copyrightYear: DateTime.now().toFormat('y'),
      termsAndConditionsUrl: urlJoin(APP_URL, '/terms-of-service'),
      privacyPolicyUrl: urlJoin(APP_URL, '/privacy-policy'),
      facebookUrl: Env.getString('SOCIAL_FACEBOOK'),
      twitterUrl: Env.getString('SOCIAL_TWITTER'),
      instagramUrl: Env.getString('SOCIAL_INSTAGRAM'),
      youtubeUrl: Env.getString('SOCIAL_YOUTUBE'),
      managePreferencesLink: urlJoin(APP_URL, '/settings/notifications'),
      unsubscribeUrl: urlJoin(APP_URL, '/unsubscribe'),
    }

    const language = targetUser.settings.language as Language | undefined
    const t = await getNotificationTFunction(language?.code)

    const mergedPayload = {
      ...notification.payload,
      ...commonPayload,
    }

    switch (notification.channel) {
      case NotificationChannel.Email:
        await sendToEmail({
          t,
          targetUser,
          notification,
          payload: mergedPayload,
        })
        break
      case NotificationChannel.NotificationTray:
        await sendToTray({
          t,
          targetUser,
          notification,
          payload: mergedPayload,
        })
        break
      case NotificationChannel.PushNotification:
        break
      case NotificationChannel.SMS:
        await sendToSMS({
          t,
          targetUser,
          notification,
          payload: mergedPayload,
        })
        break
    }

    logger?.info(
      `Sent notification ${notification.id} via ${notification.channel}`
    )
    notification.status = NotificationStatus.Sent
  } catch (e) {
    const error = e as Error
    logger?.error(
      `Error sending notification ${notification.id} via ${notification.channel}. ERROR: ${error.message}`,
      serializeError(error)
    )
    if (notification.attempts === NOTIFICATION_MAX_ATTEMPTS) {
      notification.status = NotificationStatus.Failed
    }
    noticeError(e)
  } finally {
    await notification.save()
  }
}
