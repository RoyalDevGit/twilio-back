import { DateTime } from 'luxon'
import urlJoin from 'proper-url-join'

import {
  NotificationChannel,
  NotificationContentFormat,
  NotificationType,
  NotificationConfig,
  NotificationAudience,
} from 'models/NotificationConfig'
import { Env } from 'utils/env'
import { Session } from 'models/Session'
import { User } from 'models/User'
import { queueNotification } from 'utils/notifications/queueNotification'
import { Expert } from 'models/Expert'
import { getUserAvatarUrl } from 'utils/url/getUserAvatarUrl'
import { createUserDateTime } from 'utils/date/createUserDateTime'

const APP_URL = Env.getString('APP_URL')

interface CancelledSessionNotificationOptions {
  currentUser: User
  session: Session
}

const EMAIL_SESSION_CANCELLED_BY_EXPERT_CONSUMER_TEMPLATE_ID = Env.getString(
  'EMAIL_SESSION_CANCELLED_BY_EXPERT_CONSUMER_TEMPLATE_ID'
)

export const SessionCancelledWithFullRefundConsumerConfig =
  new NotificationConfig({
    id: NotificationType.SessionCancelledByExpert,
    audience: NotificationAudience.Consumer,
    allowOptOut: true,
    templates: [
      {
        subjectTemplateKey: 'sessionCancellation.consumer.subject',
        contentFormat: NotificationContentFormat.HTML,
        channels: [NotificationChannel.Email],
        externalBodyTemplateId:
          EMAIL_SESSION_CANCELLED_BY_EXPERT_CONSUMER_TEMPLATE_ID,
      },
      {
        bodyTemplateKey: 'sessionCancellation.consumer.plainText.body',
        contentFormat: NotificationContentFormat.PlainText,
        channels: [
          NotificationChannel.NotificationTray,
          NotificationChannel.PushNotification,
        ],
      },
    ],
  })

interface ConsumerCancelledSessionPayload {
  sessionId: string
  firstName: string
  expertProfileImageUrl: string
  expertFullName: string
  expertFirstName: string
  sessionDate: string
  sessionStartTime: string
  sessionJoinUrl: string
  sessionDetailsPageUrl: string
  refundAmount: string
}

const queueConsumerNotification = async ({
  currentUser,
  session,
}: CancelledSessionNotificationOptions) => {
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const sessionDate = createUserDateTime(session.startDate.date, consumer)
  const payload: ConsumerCancelledSessionPayload = {
    sessionId: session.id,
    firstName: consumer.firstName,
    expertProfileImageUrl: await getUserAvatarUrl(expert.user),
    expertFullName: `${expert.user.firstName} ${expert.user.lastName}`,
    expertFirstName: expert.user.firstName,
    sessionDate: sessionDate.toLocaleString(DateTime.DATE_MED),
    sessionStartTime: sessionDate.toLocaleString(DateTime.TIME_SIMPLE),
    sessionJoinUrl: urlJoin(`${APP_URL}/sessions/${session.id}/room`),
    sessionDetailsPageUrl: urlJoin(
      `${APP_URL}/schedule/sessions/${session.id}`
    ),
    refundAmount: session.order.grandTotalPrice.amount.toFixed(2),
  }

  await queueNotification({
    currentUser,
    targetUser: consumer,
    referencedUser: expert.user,
    config: SessionCancelledWithFullRefundConsumerConfig,
    payload,
  })
}

const EMAIL_SESSION_CANCELLED_BY_EXPERT_EXPERT_TEMPLATE_ID = Env.getString(
  'EMAIL_SESSION_CANCELLED_BY_EXPERT_EXPERT_TEMPLATE_ID'
)

export const SessionCancelledWithFullRefundExpertConfig =
  new NotificationConfig({
    id: NotificationType.SessionCancelledByExpert,
    audience: NotificationAudience.Expert,
    allowOptOut: true,
    templates: [
      {
        subjectTemplateKey: 'sessionCancellation.expert.subject',
        contentFormat: NotificationContentFormat.HTML,
        channels: [NotificationChannel.Email],
        externalBodyTemplateId:
          EMAIL_SESSION_CANCELLED_BY_EXPERT_EXPERT_TEMPLATE_ID,
      },
    ],
  })

interface ExpertCancelledSessionPayload {
  sessionId: string
  firstName: string
  consumerProfileImageUrl: string
  consumerFullName: string
  consumerFirstName: string
  sessionDate: string
  sessionStartTime: string
  sessionJoinUrl: string
  sessionDetailsPageUrl: string
  refundAmount: string
}

const queueExpertNotification = async ({
  currentUser,
  session,
}: CancelledSessionNotificationOptions) => {
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const sessionDate = createUserDateTime(session.startDate.date, expert.user)
  const payload: ExpertCancelledSessionPayload = {
    sessionId: session.id,
    firstName: expert.user.firstName,
    consumerProfileImageUrl: await getUserAvatarUrl(consumer),
    consumerFullName: `${consumer.firstName} ${consumer.lastName}`,
    consumerFirstName: consumer.firstName,
    sessionDate: sessionDate.toLocaleString(DateTime.DATE_MED),
    sessionStartTime: sessionDate.toLocaleString(DateTime.TIME_SIMPLE),
    sessionJoinUrl: urlJoin(`${APP_URL}/sessions/${session.id}/room`),
    sessionDetailsPageUrl: urlJoin(
      `${APP_URL}/schedule/sessions/${session.id}`
    ),
    refundAmount: session.order.grandTotalPrice.amount.toFixed(2),
  }

  await queueNotification({
    currentUser,
    targetUser: expert.user,
    config: SessionCancelledWithFullRefundExpertConfig,
    payload,
  })
}

export const queueCancelledSessionByExpertNotifications = async (
  options: CancelledSessionNotificationOptions
) => {
  await Promise.all([
    queueExpertNotification(options),
    queueConsumerNotification(options),
  ])
}
