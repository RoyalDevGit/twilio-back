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
import { createUserDateTime } from 'utils/date/createUserDateTime'
import { queueInstantSessionOrderConfirmationNotifications } from 'notifications/orderConfirmation/InstantSessionOrderConfirmation'

const APP_URL = Env.getString('APP_URL')

interface SessionOrderConfirmationPayload {
  sessionId: string
  sessionDate: string
  sessionStartTime: string
  sessionJoinUrl: string
  sessionDetailsPageUrl: string
  sendAMessageUrl: string
  sessionAmount: string
  sessionDuration: number
}

interface SessionOrderConfirmationNotificationOptions {
  currentUser: User
  order: Order
  session: Session
}

interface GetBasePayloadProps {
  targetUser: User
  order: Order
  session: Session
}

const getBasePayloadProperties = ({
  targetUser,
  session,
  order,
}: GetBasePayloadProps): SessionOrderConfirmationPayload => {
  const sessionDate = createUserDateTime(session.startDate.date, targetUser)

  return {
    sessionId: session.id,
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
    sessionDuration: session.duration,
  }
}

const EMAIL_SESSION_ORDER_CONFIRMATION_CONSUMER_TEMPLATE_ID = Env.getString(
  'EMAIL_SESSION_ORDER_CONFIRMATION_CONSUMER_TEMPLATE_ID'
)

export const SessionOrderConfirmationConsumerConfig = new NotificationConfig({
  id: NotificationType.SessionOrderConfirmation,
  audience: NotificationAudience.Consumer,
  allowOptOut: false,
  templates: [
    {
      subjectTemplateKey: 'sessionOrderConfirmation.consumer.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId:
        EMAIL_SESSION_ORDER_CONFIRMATION_CONSUMER_TEMPLATE_ID,
    },
  ],
})

export interface ConsumerSessionOrderConfirmationPayload
  extends SessionOrderConfirmationPayload {
  firstName: string
  expertProfileImageUrl: string
  expertFullName: string
  expertFirstName: string
}

const queueConsumerSessionOrderConfirmationNotification = async ({
  currentUser,
  session,
  order,
}: SessionOrderConfirmationNotificationOptions) => {
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const payload: ConsumerSessionOrderConfirmationPayload = {
    ...getBasePayloadProperties({
      targetUser: consumer,
      session,
      order,
    }),
    firstName: consumer.firstName,
    expertProfileImageUrl: await getUserAvatarUrl(expert.user),
    expertFullName: `${expert.user.firstName} ${expert.user.lastName}`,
    expertFirstName: expert.user.firstName,
  }

  await queueNotification({
    currentUser,
    targetUser: consumer,
    referencedUser: expert.user,
    config: SessionOrderConfirmationConsumerConfig,
    payload,
  })
}

const EMAIL_SESSION_ORDER_CONFIRMATION_EXPERT_TEMPLATE_ID = Env.getString(
  'EMAIL_SESSION_ORDER_CONFIRMATION_EXPERT_TEMPLATE_ID'
)

export const SessionOrderConfirmationExpertConfig = new NotificationConfig({
  id: NotificationType.SessionOrderConfirmation,
  audience: NotificationAudience.Expert,
  allowOptOut: false,
  templates: [
    {
      subjectTemplateKey: 'sessionOrderConfirmation.expert.subject',
      contentFormat: NotificationContentFormat.HTML,
      channels: [NotificationChannel.Email],
      externalBodyTemplateId:
        EMAIL_SESSION_ORDER_CONFIRMATION_EXPERT_TEMPLATE_ID,
    },
    {
      bodyTemplateKey: 'sessionOrderConfirmation.expert.plainText.body',
      contentFormat: NotificationContentFormat.PlainText,
      channels: [
        NotificationChannel.NotificationTray,
        NotificationChannel.PushNotification,
      ],
    },
  ],
})

export interface ExpertSessionOrderConfirmationPayload
  extends SessionOrderConfirmationPayload {
  firstName: string
  consumerProfileImageUrl: string
  consumerFullName: string
  consumerFirstName: string
}

const queueExpertSessionOrderConfirmationNotification = async ({
  currentUser,
  session,
  order,
}: SessionOrderConfirmationNotificationOptions) => {
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const payload: ExpertSessionOrderConfirmationPayload = {
    ...getBasePayloadProperties({
      targetUser: expert.user,
      session,
      order,
    }),
    firstName: expert.user.firstName,
    consumerProfileImageUrl: await getUserAvatarUrl(consumer),
    consumerFullName: `${consumer.firstName} ${consumer.lastName}`,
    consumerFirstName: consumer.firstName,
  }

  await queueNotification({
    currentUser,
    targetUser: expert.user,
    referencedUser: consumer,
    config: SessionOrderConfirmationExpertConfig,
    payload,
  })
}

export const queueSessionOrderConfirmationNotifications = async (
  options: SessionOrderConfirmationNotificationOptions
) => {
  const { session } = options
  if (session.instant) {
    await queueInstantSessionOrderConfirmationNotifications(options)
  } else {
    await Promise.all([
      queueExpertSessionOrderConfirmationNotification(options),
      queueConsumerSessionOrderConfirmationNotification(options),
    ])
  }
}
