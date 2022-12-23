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

interface SessionOrderConfirmationNotificationOptions {
  currentUser: User
  order: Order
  session: Session
}

const EMAIL_SESSION_FAILED_PAYMENT_CONSUMER_TEMPLATE_ID = Env.getString(
  'EMAIL_SESSION_FAILED_PAYMENT_CONSUMER_TEMPLATE_ID'
)

const FAILED_SESSION_PAYMENT_AUTOMATIC_CANCELLATION_WINDOW = Env.getDuration(
  'FAILED_SESSION_PAYMENT_AUTOMATIC_CANCELLATION_WINDOW'
)

export const SessionPaymentFailedConfig = new NotificationConfig({
  id: NotificationType.FailedSessionPayment,
  audience: NotificationAudience.Consumer,
  allowOptOut: false,
  templates: [
    {
      subjectTemplateKey: 'failedPaymentAuth.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId: EMAIL_SESSION_FAILED_PAYMENT_CONSUMER_TEMPLATE_ID,
    },
    {
      bodyTemplateKey: 'failedPaymentAuth.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

export interface SessionFailedPaymentPayload {
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
  autoCancellationDuration: string
  updatePaymentUrl: string
}

export const queueSessionFailedPaymentNotification = async ({
  session,
  order,
  currentUser,
}: SessionOrderConfirmationNotificationOptions) => {
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const sessionDate = createUserDateTime(session.startDate.date, consumer)
  const payload: SessionFailedPaymentPayload = {
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
    sessionAmount: order.totalPrice.amount.toFixed(2),
    autoCancellationDuration: toHumanDuration(
      FAILED_SESSION_PAYMENT_AUTOMATIC_CANCELLATION_WINDOW,
      { smallestUnit: 'hours', largestUnit: 'hours' }
    ),
    updatePaymentUrl: urlJoin(
      `${APP_URL}/sessions/${session.id}/update-payment`
    ),
  }

  await queueNotification({
    currentUser,
    targetUser: consumer,
    config: SessionPaymentFailedConfig,
    payload,
  })
}
