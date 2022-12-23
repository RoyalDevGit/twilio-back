import { DateTime } from 'luxon'

import {
  Order,
  OrderItem,
  OrderItemStatus,
  OrderItemType,
  OrderModel,
  OrderStatus,
  SessionExtensionOrderItem,
  SessionOrderItem,
} from 'models/Order'
import { SessionExtensionRequestStatus } from 'models/SessionExtensionRequest'
import { User } from 'models/User'
import { queueSessionExtensionOrderConfirmationNotifications } from 'notifications/orderConfirmation/SessionExtensionOrderConfirmation'
import { queueSessionOrderConfirmationNotifications } from 'notifications/orderConfirmation/SessionOrderConfirmation'
import { createSessionFromOrderItem } from 'repositories/session/createSessionFromOrderItem'
import { getCurrentSessionExtension } from 'repositories/session/getCurrentSessionExtension'
import { getSessionById } from 'repositories/session/getSessionById'
import { emitToSession } from 'sockets/userIO'

const fulfillSessionOrderItem = async (
  orderItem: OrderItem<SessionOrderItem>,
  order: Order,
  currentUser: User
) => {
  const session = await createSessionFromOrderItem(orderItem, order)
  order.session = session

  queueSessionOrderConfirmationNotifications({ order, session, currentUser })
}

const fulfillSessionExtension = async (
  orderItem: OrderItem<SessionExtensionOrderItem>,
  order: Order,
  currentUser: User
) => {
  const sessionToExtend = await getSessionById(orderItem.data.session)
  if (!sessionToExtend) {
    throw new Error('The session in the order does not exist')
  }

  const currentExtension = await getCurrentSessionExtension(sessionToExtend.id)
  if (!currentExtension) {
    throw new Error('The session extension request was not found')
  }
  sessionToExtend.duration = sessionToExtend.duration + orderItem.data.duration
  sessionToExtend.endDate.date = DateTime.fromJSDate(
    sessionToExtend.endDate.date
  )
    .plus({ minutes: orderItem.data.duration })
    .toJSDate()

  currentExtension.status = SessionExtensionRequestStatus.Complete
  await currentExtension.save()
  await sessionToExtend.save()

  currentExtension.session = sessionToExtend
  emitToSession(sessionToExtend, 'sessionExtensionComplete', currentExtension)
  queueSessionExtensionOrderConfirmationNotifications({
    order,
    session: sessionToExtend,
    extensionRequest: currentExtension,
    currentUser,
  })
}

export const fulfillOrder = async (order: Order, currentUser: User) => {
  for (let i = 0; i < order.items.length; i++) {
    const orderItem = order.items[i]
    if (orderItem.status === OrderItemStatus.Fulfilled) {
      continue
    }
    switch (orderItem.itemType) {
      case OrderItemType.Session:
        await fulfillSessionOrderItem(
          orderItem as OrderItem<SessionOrderItem>,
          order,
          currentUser
        )
        break
      case OrderItemType.SessionExtension:
        await fulfillSessionExtension(
          orderItem as OrderItem<SessionExtensionOrderItem>,
          order,
          currentUser
        )
        break
    }
  }

  await OrderModel.findByIdAndUpdate(order.id, {
    status: OrderStatus.Complete,
  })
}
