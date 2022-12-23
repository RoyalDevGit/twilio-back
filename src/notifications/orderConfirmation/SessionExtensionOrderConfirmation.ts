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
import { Order, OrderItem, SessionExtensionOrderItem } from 'models/Order'
import { User } from 'models/User'
import { queueNotification } from 'utils/notifications/queueNotification'
import { getUserAvatarUrl } from 'utils/url/getUserAvatarUrl'
import { Expert } from 'models/Expert'
import { Session } from 'models/Session'
import { humanizeMinutes } from 'utils/duration/humanizeMinutes'
import { SessionExtensionRequest } from 'models/SessionExtensionRequest'
import { createUserDateTime } from 'utils/date/createUserDateTime'

const APP_URL = Env.getString('APP_URL')

interface SessionExtensionOrderConfirmationNotificationOptions {
  currentUser: User
  order: Order
  session: Session
  extensionRequest: SessionExtensionRequest
}

const EMAIL_SESSION_EXTENSION_ORDER_CONFIRMATION_CONSUMER_TEMPLATE_ID =
  Env.getString(
    'EMAIL_SESSION_EXTENSION_ORDER_CONFIRMATION_CONSUMER_TEMPLATE_ID'
  )

export const SessionExtensionOrderConfirmationConsumerConfig =
  new NotificationConfig({
    id: NotificationType.SessionExtensionOrderConfirmation,
    audience: NotificationAudience.Consumer,
    allowOptOut: false,
    templates: [
      {
        subjectTemplateKey:
          'sessionExtensionOrderConfirmation.consumer.subject',
        contentFormat: NotificationContentFormat.HTML,
        channels: [
          NotificationChannel.Email,
          NotificationChannel.PushNotification,
        ],
        externalBodyTemplateId:
          EMAIL_SESSION_EXTENSION_ORDER_CONFIRMATION_CONSUMER_TEMPLATE_ID,
      },
    ],
  })

export interface ConsumerSessionExtensionOrderConfirmationPayload {
  sessionId: string
  firstName: string
  expertProfileImageUrl: string
  expertFullName: string
  expertFirstName: string
  sessionDate: string
  sessionStartTime: string
  sessionEndTime: string
  sessionJoinUrl: string
  sessionDetailsPageUrl: string
  sendAMessageUrl: string
  extensionAmount: string
  grandTotalAmount: string
  extensionDuration: string
}

const queueConsumerSessionExtensionOrderConfirmationNotification = async ({
  currentUser,
  session,
  order,
}: SessionExtensionOrderConfirmationNotificationOptions) => {
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const sessionStartDate = createUserDateTime(session.startDate.date, consumer)
  const sessionEndDate = createUserDateTime(session.endDate.date, consumer)

  const orderItem = order.items[0] as OrderItem<SessionExtensionOrderItem>
  const humanizedMinutes = humanizeMinutes(orderItem.data.duration)

  const payload: ConsumerSessionExtensionOrderConfirmationPayload = {
    sessionId: session.id,
    firstName: consumer.firstName,
    expertProfileImageUrl: await getUserAvatarUrl(expert.user),
    expertFullName: `${expert.user.firstName} ${expert.user.lastName}`,
    expertFirstName: expert.user.firstName,
    sessionDate: sessionStartDate.toLocaleString(DateTime.DATE_MED),
    sessionStartTime: sessionStartDate.toLocaleString(DateTime.TIME_SIMPLE),
    sessionEndTime: sessionEndDate.toLocaleString(DateTime.TIME_SIMPLE),
    sessionJoinUrl: urlJoin(`${APP_URL}/sessions/${session.id}/room`),
    sessionDetailsPageUrl: urlJoin(
      `${APP_URL}/schedule/sessions/${session.id}`
    ),
    sendAMessageUrl: urlJoin(
      `${APP_URL}/schedule/sessions/${session.id}?openChat=true`
    ),
    extensionAmount: order.totalPrice.amount.toFixed(2),
    extensionDuration: `${humanizedMinutes.value} ${humanizedMinutes.unit}`,
    grandTotalAmount: order.grandTotalPrice.amount.toFixed(2),
  }

  await queueNotification({
    currentUser,
    targetUser: consumer,
    referencedUser: expert.user,
    config: SessionExtensionOrderConfirmationConsumerConfig,
    payload,
  })
}

const EMAIL_SESSION_EXTENSION_ORDER_CONFIRMATION_EXPERT_TEMPLATE_ID =
  Env.getString('EMAIL_SESSION_EXTENSION_ORDER_CONFIRMATION_EXPERT_TEMPLATE_ID')

export const SessionExtensionOrderConfirmationExpertConfig =
  new NotificationConfig({
    id: NotificationType.SessionExtensionOrderConfirmation,
    audience: NotificationAudience.Expert,
    allowOptOut: false,
    templates: [
      {
        subjectTemplateKey: 'sessionExtensionOrderConfirmation.expert.subject',
        contentFormat: NotificationContentFormat.HTML,
        channels: [
          NotificationChannel.Email,
          NotificationChannel.PushNotification,
        ],
        externalBodyTemplateId:
          EMAIL_SESSION_EXTENSION_ORDER_CONFIRMATION_EXPERT_TEMPLATE_ID,
      },
    ],
  })

export interface ExpertSessionExtensionOrderConfirmationPayload {
  sessionId: string
  firstName: string
  consumerProfileImageUrl: string
  consumerFullName: string
  consumerFirstName: string
  sessionDate: string
  sessionStartTime: string
  sessionEndTime: string
  sessionJoinUrl: string
  sessionDetailsPageUrl: string
  sendAMessageUrl: string
  extensionAmount: string
  grandTotalAmount: string
  extensionDuration: string
}

const queueExpertSessionExtensionOrderConfirmationNotification = async ({
  currentUser,
  session,
  order,
}: SessionExtensionOrderConfirmationNotificationOptions) => {
  const expert = session.expert as Expert
  const consumer = session.consumer as User
  const sessionStartDate = createUserDateTime(
    session.startDate.date,
    expert.user
  )
  const sessionEndDate = createUserDateTime(session.endDate.date, expert.user)

  const orderItem = order.items[0] as OrderItem<SessionExtensionOrderItem>
  const humanizedMinutes = humanizeMinutes(orderItem.data.duration)

  const payload: ExpertSessionExtensionOrderConfirmationPayload = {
    sessionId: session.id,
    firstName: expert.user.firstName,
    consumerProfileImageUrl: await getUserAvatarUrl(consumer),
    consumerFullName: `${consumer.firstName} ${consumer.lastName}`,
    consumerFirstName: consumer.firstName,
    sessionDate: sessionStartDate.toLocaleString(DateTime.DATE_MED),
    sessionStartTime: sessionStartDate.toLocaleString(DateTime.TIME_SIMPLE),
    sessionEndTime: sessionEndDate.toLocaleString(DateTime.TIME_SIMPLE),
    sessionJoinUrl: urlJoin(`${APP_URL}/sessions/${session.id}/room`),
    sessionDetailsPageUrl: urlJoin(
      `${APP_URL}/schedule/sessions/${session.id}`
    ),
    sendAMessageUrl: urlJoin(
      `${APP_URL}/schedule/sessions/${session.id}?openChat=true`
    ),
    extensionAmount: order.totalPrice.amount.toFixed(2),
    extensionDuration: `${humanizedMinutes.value} ${humanizedMinutes.unit}`,
    grandTotalAmount: order.grandTotalPrice.amount.toFixed(2),
  }

  await queueNotification({
    currentUser,
    targetUser: expert.user,
    referencedUser: consumer,
    config: SessionExtensionOrderConfirmationExpertConfig,
    payload,
  })
}

export const queueSessionExtensionOrderConfirmationNotifications = async (
  options: SessionExtensionOrderConfirmationNotificationOptions
) => {
  await Promise.all([
    queueExpertSessionExtensionOrderConfirmationNotification(options),
    queueConsumerSessionExtensionOrderConfirmationNotification(options),
  ])
}
