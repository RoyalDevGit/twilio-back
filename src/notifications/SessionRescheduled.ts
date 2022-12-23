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

interface RescheduledSessionNotificationOptions {
  currentUser: User
  session: Session
}

const EMAIL_SESSION_RESCHEDULED_CONSUMER_TEMPLATE_ID = Env.getString(
  'EMAIL_SESSION_RESCHEDULED_CONSUMER_TEMPLATE_ID'
)

export const SessionRescheduledConsumerConfig = new NotificationConfig({
  id: NotificationType.SessionRescheduled,
  audience: NotificationAudience.Consumer,
  allowOptOut: true,
  templates: [
    {
      subjectTemplateKey: 'sessionReschedule.consumer.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_SESSION_RESCHEDULED_CONSUMER_TEMPLATE_ID,
    },
    {
      preventSelfNotifications: true,
      bodyTemplateKey: 'sessionReschedule.consumer.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

interface ConsumerRescheduledSessionPayload {
  sessionId: string
  firstName: string
  expertProfileImageUrl: string
  expertFullName: string
  expertFirstName: string
  sessionDate: string
  sessionStartTime: string
  sessionJoinUrl: string
  sessionDetailsPageUrl: string
}

const queueConsumerNotification = async ({
  currentUser,
  session,
}: RescheduledSessionNotificationOptions) => {
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const sessionDate = createUserDateTime(session.startDate.date, consumer)
  const payload: ConsumerRescheduledSessionPayload = {
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
  }

  await queueNotification({
    currentUser,
    targetUser: consumer,
    referencedUser: expert.user,
    config: SessionRescheduledConsumerConfig,
    payload,
  })
}

const EMAIL_SESSION_RESCHEDULED_EXPERT_TEMPLATE_ID = Env.getString(
  'EMAIL_SESSION_RESCHEDULED_EXPERT_TEMPLATE_ID'
)

export const SessionRescheduledExpertConfig = new NotificationConfig({
  id: NotificationType.SessionRescheduled,
  audience: NotificationAudience.Expert,
  allowOptOut: true,
  templates: [
    {
      subjectTemplateKey: 'sessionReschedule.expert.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_SESSION_RESCHEDULED_EXPERT_TEMPLATE_ID,
    },
    {
      preventSelfNotifications: true,
      bodyTemplateKey: 'sessionReschedule.expert.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

interface ExpertRescheduledSessionPayload {
  sessionId: string
  firstName: string
  consumerProfileImageUrl: string
  consumerFullName: string
  consumerFirstName: string
  sessionDate: string
  sessionStartTime: string
  sessionJoinUrl: string
  sessionDetailsPageUrl: string
}

const queueExpertNotification = async ({
  currentUser,
  session,
}: RescheduledSessionNotificationOptions) => {
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const sessionDate = createUserDateTime(session.startDate.date, expert.user)
  const payload: ExpertRescheduledSessionPayload = {
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
  }

  await queueNotification({
    currentUser,
    targetUser: expert.user,
    referencedUser: consumer,
    config: SessionRescheduledExpertConfig,
    payload,
  })
}

export const queueRescheduledSessionNotifications = async (
  options: RescheduledSessionNotificationOptions
) => {
  await Promise.all([
    queueExpertNotification(options),
    queueConsumerNotification(options),
  ])
}
