import { DateTime } from 'luxon'

import { Expert } from 'models/Expert'
import {
  NotificationChannel,
  NotificationContentFormat,
  NotificationType,
  NotificationConfig,
  NotificationAudience,
} from 'models/NotificationConfig'
import { Session } from 'models/Session'
import { User } from 'models/User'
import { queueNotification } from 'utils/notifications/queueNotification'
import { Env } from 'utils/env'
import { createUserDateTime } from 'utils/date/createUserDateTime'

interface QueueMissedSessionNotificationOptions {
  currentUser: User
  session: Session
}

const EMAIL_EXPERT_MISSED_SESSION_APOLOGY_TEMPLATE_ID = Env.getString(
  'EMAIL_EXPERT_MISSED_SESSION_APOLOGY_TEMPLATE_ID'
)

export const ExpertMissedSessionApologyConfig = new NotificationConfig({
  id: NotificationType.MissedSessionApology,
  audience: NotificationAudience.Consumer,
  allowOptOut: false,
  templates: [
    {
      subjectTemplateKey: 'missedSessionApology.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_EXPERT_MISSED_SESSION_APOLOGY_TEMPLATE_ID,
    },
    {
      bodyTemplateKey: 'missedSessionApology.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

export interface ExpertMissedSessionApologiesPayload {
  sessionId: string
  firstName: string
  expertFullName: string
  expertFirstName: string
  sessionDate: string
  sessionStartTime: string
}

export const queueExpertMissedSessionApologiesNotification = async ({
  currentUser,
  session,
}: QueueMissedSessionNotificationOptions) => {
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const sessionDate = createUserDateTime(session.startDate.date, consumer)
  const payload: ExpertMissedSessionApologiesPayload = {
    sessionId: session.id,
    firstName: consumer.firstName,
    expertFullName: `${expert.user.firstName} ${expert.user.lastName}`,
    expertFirstName: expert.user.firstName,
    sessionDate: sessionDate.toLocaleString(DateTime.DATE_MED),
    sessionStartTime: sessionDate.toLocaleString(DateTime.TIME_SIMPLE),
  }

  await queueNotification({
    currentUser,
    targetUser: consumer,
    config: ExpertMissedSessionApologyConfig,
    payload,
  })
}

const EMAIL_MISSED_SESSION_EXPERT_TEMPLATE_ID = Env.getString(
  'EMAIL_MISSED_SESSION_EXPERT_TEMPLATE_ID'
)

export const MissedSessionExpertConfig = new NotificationConfig({
  id: NotificationType.MissedSession,
  audience: NotificationAudience.Expert,
  allowOptOut: false,
  templates: [
    {
      subjectTemplateKey: 'missedSession.expert.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_MISSED_SESSION_EXPERT_TEMPLATE_ID,
    },
    {
      bodyTemplateKey: 'missedSession.expert.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

export interface ExpertMissedSessionPayload {
  sessionId: string
  firstName: string
  consumerFullName: string
  consumerFirstName: string
  sessionDate: string
  sessionStartTime: string
}

export const queueExpertMissedSessionNotification = async ({
  currentUser,
  session,
}: QueueMissedSessionNotificationOptions) => {
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const sessionDate = createUserDateTime(session.startDate.date, expert.user)
  const payload: ExpertMissedSessionPayload = {
    sessionId: session.id,
    firstName: expert.user.firstName,
    consumerFullName: `${consumer.firstName} ${consumer.lastName}`,
    consumerFirstName: consumer.firstName,
    sessionDate: sessionDate.toLocaleString(DateTime.DATE_MED),
    sessionStartTime: sessionDate.toLocaleString(DateTime.TIME_SIMPLE),
  }

  await queueNotification({
    currentUser,
    targetUser: expert.user,
    config: MissedSessionExpertConfig,
    payload,
  })
}

const EMAIL_MISSED_SESSION_CONSUMER_TEMPLATE_ID = Env.getString(
  'EMAIL_MISSED_SESSION_CONSUMER_TEMPLATE_ID'
)

export const MissedSessionConsumerConfig = new NotificationConfig({
  id: NotificationType.MissedSession,
  audience: NotificationAudience.Consumer,
  allowOptOut: false,
  templates: [
    {
      subjectTemplateKey: 'missedSession.consumer.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_MISSED_SESSION_CONSUMER_TEMPLATE_ID,
    },
    {
      bodyTemplateKey: 'missedSession.consumer.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

export interface ConsumerMissedSessionPayload {
  sessionId: string
  firstName: string
  expertFullName: string
  expertFirstName: string
  sessionDate: string
  sessionStartTime: string
}

export const queueConsumerMissedSessionNotification = async ({
  currentUser,
  session,
}: QueueMissedSessionNotificationOptions) => {
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const sessionDate = createUserDateTime(session.startDate.date, consumer)
  const payload: ConsumerMissedSessionPayload = {
    sessionId: session.id,
    firstName: consumer.firstName,
    expertFullName: `${expert.user.firstName} ${expert.user.lastName}`,
    expertFirstName: expert.user.firstName,
    sessionDate: sessionDate.toLocaleString(DateTime.DATE_MED),
    sessionStartTime: sessionDate.toLocaleString(DateTime.TIME_SIMPLE),
  }

  await queueNotification({
    currentUser,
    targetUser: consumer,
    config: MissedSessionConsumerConfig,
    payload,
  })
}
