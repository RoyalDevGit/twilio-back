import Stripe from 'stripe'

import { stripe } from 'apis/Stripe'
import { PaymentMethod } from 'models/PaymentMethod'
import { saveStripeOrder } from 'utils/stripe/saveStripeOrder'
import { convertPriceToCents } from 'utils/commerce/convertPriceToCents'
import { Order, OrderPaymentStatus } from 'models/Order'

export const holdOrderFunds = async (order: Order) => {
  if (!order.paymentMethod) {
    throw new Error('Cannot authorize order without a payment method')
  }

  let stripeOrder: Stripe.Response<Stripe.Order>
  if (!order.stripeOrderId) {
    stripeOrder = await saveStripeOrder(order)
  } else {
    stripeOrder = await stripe.orders.retrieve(order.stripeOrderId)
    if (
      stripeOrder.status === 'canceled' ||
      stripeOrder.status === 'complete' ||
      stripeOrder.status === 'processing'
    ) {
      throw new Error(
        `Cannot authorize an order that has a stripe order in a status of '${stripeOrder.status}'`
      )
    }
  }

  if (stripeOrder.status === 'open') {
    stripeOrder = await stripe.orders.submit(stripeOrder.id, {
      expected_total: convertPriceToCents(order.totalPrice.amount),
    })
  }

  const paymentMethod = order.paymentMethod as PaymentMethod
  const orderPaymentIntentId = stripeOrder.payment.payment_intent as string
  await stripe.paymentIntents.confirm(orderPaymentIntentId, {
    payment_method: paymentMethod.stripePaymentMethodId,
  })

  order.paymentStatus = OrderPaymentStatus.Authorized
  await order.save()
}
