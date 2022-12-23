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
import { getUserAvatarUrl } from 'utils/url/getUserAvatarUrl'
import { Expert } from 'models/Expert'
import { createUserDateTime } from 'utils/date/createUserDateTime'

const APP_URL = Env.getString('APP_URL')

interface UpcomingSessionNotificationOptions {
  currentUser: User
  session: Session
}

const EMAIL_UPCOMING_SESSION_EXPERT_TEMPLATE_ID = Env.getString(
  'EMAIL_UPCOMING_SESSION_EXPERT_TEMPLATE_ID'
)

export const UpcomingSessionExpertConfig = new NotificationConfig({
  id: NotificationType.UpcomingSession,
  audience: NotificationAudience.Expert,
  allowOptOut: true,
  templates: [
    {
      subjectTemplateKey: 'upcomingSession.expert.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_UPCOMING_SESSION_EXPERT_TEMPLATE_ID,
    },
    {
      bodyTemplateKey: 'upcomingSession.expert.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

export interface ExpertUpcomingSessionPayload {
  sessionId: string
  firstName: string
  sessionStartRemainingTime: string
  consumerProfileImageUrl: string
  consumerFullName: string
  consumerFirstName: string
  sessionDate: string
  sessionStartTime: string
  sessionJoinUrl: string
  sessionDetailsPageUrl: string
}

const queueExpertUpcomingSessionNotification = async ({
  currentUser,
  session,
}: UpcomingSessionNotificationOptions) => {
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const sessionDate = createUserDateTime(session.startDate.date, expert.user)
  const payload: ExpertUpcomingSessionPayload = {
    sessionId: session.id,
    firstName: expert.user.firstName,
    sessionStartRemainingTime: sessionDate.toRelative() as string,
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
    config: UpcomingSessionExpertConfig,
    payload,
  })
}

const EMAIL_UPCOMING_SESSION_CONSUMER_TEMPLATE_ID = Env.getString(
  'EMAIL_UPCOMING_SESSION_CONSUMER_TEMPLATE_ID'
)

export const UpcomingSessionConsumerConfig = new NotificationConfig({
  id: NotificationType.UpcomingSession,
  audience: NotificationAudience.Consumer,
  allowOptOut: true,
  templates: [
    {
      subjectTemplateKey: 'upcomingSession.consumer.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_UPCOMING_SESSION_CONSUMER_TEMPLATE_ID,
    },
    {
      bodyTemplateKey: 'upcomingSession.consumer.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

export interface ConsumerUpcomingSessionPayload {
  sessionId: string
  firstName: string
  sessionStartRemainingTime: string
  expertProfileImageUrl: string
  expertFullName: string
  expertFirstName: string
  sessionDate: string
  sessionStartTime: string
  sessionJoinUrl: string
  sessionDetailsPageUrl: string
}

const queueConsumerUpcomingSessionNotification = async ({
  currentUser,
  session,
}: UpcomingSessionNotificationOptions) => {
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const sessionDate = createUserDateTime(session.startDate.date, consumer)
  const payload: ConsumerUpcomingSessionPayload = {
    sessionId: session.id,
    firstName: consumer.firstName,
    sessionStartRemainingTime: sessionDate.toRelative() as string,
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
    config: UpcomingSessionConsumerConfig,
    payload,
  })
}

export const queueUpcomingSessionNotifications = async (
  options: UpcomingSessionNotificationOptions
) => {
  await Promise.all([
    queueExpertUpcomingSessionNotification(options),
    queueConsumerUpcomingSessionNotification(options),
  ])
}
