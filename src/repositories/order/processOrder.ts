import { DateTime } from 'luxon'

import { holdOrderFunds } from 'commerceOperations/holdOrderFunds'
import {
  Order,
  OrderItemType,
  OrderItem,
  SessionOrderItem,
  OrderStatus,
} from 'models/Order'
import { checkIfWithinPaymentAuthWindow } from 'utils/commerce/checkIfWithinPaymentAuthWindow'
import { fulfillOrder } from 'repositories/order/fulfillOrder'
import { validateOrderForProcessing } from 'repositories/order/validateOrderForProcessing'
import { User } from 'models/User'
import { getSessionByOrderId } from 'repositories/session/getSessionById'

/**
 * If an order doesn't go through, we want to reverse certain
 * fields and dependencies before proceeding
 * @param order
 */
const cleanUpOrder = async (order: Order) => {
  order.stripeOrderId = ''
  order.stripeOrderClientSecret = ''
  order.isProcessing = false
  const session = await getSessionByOrderId(order.id)
  if (session) {
    await session.delete()
  }
  await order.save()
}

export const processOrder = async (order: Order, currentUser: User) => {
  if (order.isProcessing) {
    throw new Error('Order is already being processed')
  }

  try {
    order.isProcessing = true
    await order.save()

    await validateOrderForProcessing(order)

    let holdPayment = true

    const sessionOrderItem = order.items.find(
      (o) => o.itemType === OrderItemType.Session
    ) as OrderItem<SessionOrderItem> | undefined

    if (sessionOrderItem) {
      const sessionStartDate = DateTime.fromISO(
        sessionOrderItem.data.startDate.date
      )
      if (!checkIfWithinPaymentAuthWindow(sessionStartDate)) {
        holdPayment = false
      }
    }

    if (holdPayment) {
      await holdOrderFunds(order)
    }

    await fulfillOrder(order, currentUser)
    order.isProcessing = false
    order.status = OrderStatus.Complete
    await order.save()
  } catch (e) {
    await cleanUpOrder(order)
    const error = e as Error
    throw new Error(error.message)
  }
}
