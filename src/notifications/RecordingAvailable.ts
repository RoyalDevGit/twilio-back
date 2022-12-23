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
import { User } from 'models/User'
import { queueNotification } from 'utils/notifications/queueNotification'
import { Expert } from 'models/Expert'
import { Session } from 'models/Session'
import { Video } from 'models/Video'
import { sessionPopulationPaths } from 'repositories/session/populateSession'
import { createUserDateTime } from 'utils/date/createUserDateTime'

const APP_URL = Env.getString('APP_URL')

export interface RecordingAvailablePayload {
  firstName: string
  otherUserFullName: string
  recordingDate: string
  recordingStartTime: string
  sessionDetailsPageUrl: string
  sessionId: string
}

const EMAIL_SESSION_RECORDING_AVAILABLE_TEMPLATE_ID = Env.getString(
  'EMAIL_SESSION_RECORDING_AVAILABLE_TEMPLATE_ID'
)

export const RecordingAvailableConfig = new NotificationConfig({
  id: NotificationType.RecordingAvailable,
  audience: NotificationAudience.All,
  allowOptOut: true,
  templates: [
    {
      subjectTemplateKey: 'availableSessionRecording.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_SESSION_RECORDING_AVAILABLE_TEMPLATE_ID,
    },
    {
      bodyTemplateKey: 'availableSessionRecording.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

interface QueueSessionRecodingAvailableNotificationOptions {
  currentUser: User
  session: Session
  video: Video
}

export const queueSessionRecodingAvailableNotification = async ({
  currentUser,
  session,
  video,
}: QueueSessionRecodingAvailableNotificationOptions) => {
  await session.populate(sessionPopulationPaths)
  const consumer = session.consumer as User
  const expert = session.expert as Expert

  const consumerVideoDate = createUserDateTime(video.uploaded, consumer)
  const expertVideoDate = createUserDateTime(video.uploaded, expert.user)

  const sessionDetailsPageUrl = urlJoin(
    `${APP_URL}/schedule/sessions/${session.id}`
  )

  const consumerPayload: RecordingAvailablePayload = {
    sessionId: session.id,
    firstName: consumer.firstName,
    otherUserFullName: `${expert.user.firstName} ${expert.user.lastName}`,
    sessionDetailsPageUrl,
    recordingDate: consumerVideoDate.toLocaleString(DateTime.DATE_MED),
    recordingStartTime: consumerVideoDate.toLocaleString(DateTime.TIME_SIMPLE),
  }
  queueNotification({
    currentUser,
    targetUser: consumer,
    config: RecordingAvailableConfig,
    payload: consumerPayload,
  })

  const expertPayload: RecordingAvailablePayload = {
    sessionId: session.id,
    firstName: expert.user.firstName,
    otherUserFullName: `${consumer.firstName} ${consumer.lastName}`,
    sessionDetailsPageUrl,
    recordingDate: expertVideoDate.toLocaleString(DateTime.DATE_MED),
    recordingStartTime: expertVideoDate.toLocaleString(DateTime.TIME_SIMPLE),
  }
  await queueNotification({
    currentUser,
    targetUser: expert.user,
    config: RecordingAvailableConfig,
    payload: expertPayload,
  })
}
