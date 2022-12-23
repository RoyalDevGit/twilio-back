import Stripe from 'stripe'

import { stripe } from 'apis/Stripe'
import { PaymentMethod } from 'models/PaymentMethod'
import { saveStripeOrder } from 'utils/stripe/saveStripeOrder'
import { convertPriceToCents } from 'utils/commerce/convertPriceToCents'
import { Order, OrderPaymentStatus } from 'models/Order'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'

export const captureOrderFunds = async (order: Order) => {
  if (!order.paymentMethod) {
    throw new ApiError(
      'cannotCaptureFundsOfAnOrderWithoutAPaymentMethod',
      ApiErrorCode.Forbidden
    )
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
      throw new ApiError(
        'cannotCaptureFundsOfAStripeOrderInIncorrectStatus',
        ApiErrorCode.Unknown
      )
    }
  }

  if (stripeOrder.status === 'open') {
    stripeOrder = await stripe.orders.submit(stripeOrder.id, {
      expected_total: convertPriceToCents(order.totalPrice.amount),
    })
  }

  const paymentMethod = order.paymentMethod as PaymentMethod
  const paymentIntentId = stripeOrder.payment.payment_intent as string

  let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

  if (
    paymentIntent.status === 'requires_action' ||
    paymentIntent.status === 'requires_payment_method'
  ) {
    paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethod.stripePaymentMethodId,
      capture_method: 'automatic',
    })
  } else {
    paymentIntent = await stripe.paymentIntents.capture(paymentIntentId)
  }

  order.paymentStatus = OrderPaymentStatus.Captured
  await order.save()
}
