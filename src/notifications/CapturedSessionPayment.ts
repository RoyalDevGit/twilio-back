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
import { Order } from 'models/Order'
import { User } from 'models/User'
import { queueNotification } from 'utils/notifications/queueNotification'
import { getUserAvatarUrl } from 'utils/url/getUserAvatarUrl'
import { Expert } from 'models/Expert'
import { Session } from 'models/Session'
import { toHumanDuration } from 'utils/duration/toHumanDuration'
import { createUserDateTime } from 'utils/date/createUserDateTime'

const APP_URL = Env.getString('APP_URL')

interface SessionCapturedPaymentNotificationOptions {
  currentUser: User
  order: Order
  session: Session
}

const EMAIL_SESSION_CAPTURED_PAYMENT_CONSUMER_TEMPLATE_ID = Env.getString(
  'EMAIL_SESSION_CAPTURED_PAYMENT_CONSUMER_TEMPLATE_ID'
)

const POST_SESSION_MESSAGING_RESTRICTION_DURATION = Env.getDuration(
  'POST_SESSION_MESSAGING_RESTRICTION_DURATION'
)

export const SessionPaymentCapturedConfig = new NotificationConfig({
  id: NotificationType.CapturedSessionPayment,
  audience: NotificationAudience.Consumer,
  allowOptOut: false,
  templates: [
    {
      subjectTemplateKey: 'paymentCaptured.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId:
        EMAIL_SESSION_CAPTURED_PAYMENT_CONSUMER_TEMPLATE_ID,
    },
    {
      bodyTemplateKey: 'paymentCaptured.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

export interface SessionCapturedPaymentPayload {
  sessionId: string
  firstName: string
  expertProfileImageUrl: string
  expertFullName: string
  expertFirstName: string
  sessionDate: string
  sessionStartTime: string
  sessionJoinUrl: string
  sessionDetailsPageUrl: string
  sendAMessageUrl: string
  sessionAmount: string
  messagingLockWindow: string
  expertProfileUrl: string
}

export const queueSessionCapturedPaymentNotification = async ({
  session,
  order,
  currentUser,
}: SessionCapturedPaymentNotificationOptions) => {
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const sessionDate = createUserDateTime(session.startDate.date, consumer)
  const payload: SessionCapturedPaymentPayload = {
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
    sendAMessageUrl: urlJoin(
      `${APP_URL}/schedule/sessions/${session.id}?openChat=true`
    ),
    sessionAmount: order.grandTotalPrice.amount.toFixed(2),
    messagingLockWindow: toHumanDuration(
      POST_SESSION_MESSAGING_RESTRICTION_DURATION,
      { smallestUnit: 'hours', largestUnit: 'hours' }
    ),
    expertProfileUrl: urlJoin(`${APP_URL}/experts/${expert.id}`),
  }

  await queueNotification({
    currentUser,
    targetUser: consumer,
    config: SessionPaymentCapturedConfig,
    payload,
  })
}
