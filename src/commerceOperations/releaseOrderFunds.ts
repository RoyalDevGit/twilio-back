import { stripe } from 'apis/Stripe'
import { Order, OrderPaymentStatus } from 'models/Order'

export const releaseOrderFunds = async (order: Order) => {
  if (!order.stripeOrderId) {
    return
  }

  if (order.paymentStatus !== OrderPaymentStatus.Authorized) {
    throw new Error(
      'Cannot release funds on an order that does not have paymentStatus of "authorized"'
    )
  }

  let stripeOrder = await stripe.orders.retrieve(order.stripeOrderId)
  if (
    stripeOrder.status === 'complete' ||
    stripeOrder.status === 'processing'
  ) {
    throw new Error(
      `Cannot release funds on an order that has a stripe order in a status of '${stripeOrder.status}'`
    )
  }

  if (stripeOrder.status === 'open' || stripeOrder.status === 'canceled') {
    return
  }

  stripeOrder = await stripe.orders.cancel(stripeOrder.id)

  order.stripeOrderId = undefined
  order.stripeOrderClientSecret = undefined
  order.paymentStatus = OrderPaymentStatus.NotStarted
  await order.save()
}
