import Stripe from 'stripe'
import { round } from 'mathjs'

import { stripe } from 'apis/Stripe'
import { PaymentMethod } from 'models/PaymentMethod'
import { saveStripeOrder } from 'utils/stripe/saveStripeOrder'
import { convertPriceToCents } from 'utils/commerce/convertPriceToCents'
import {
  LateSessionSessionCancellationOrderItem,
  OrderItem,
  OrderItemStatus,
  OrderItemType,
  OrderPaymentStatus,
  OrderRefundStatus,
  SessionOrderItem,
} from 'models/Order'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'
import { Session } from 'models/Session'
import { Env } from 'utils/env'
import { releaseOrderFunds } from 'commerceOperations/releaseOrderFunds'

const LATE_SESSION_REFUND_PERCENTAGE =
  Env.getNumber('LATE_SESSION_REFUND_PERCENTAGE') / 100

export const cancelSessionWithPartialRefund = async (session: Session) => {
  if (!session.order) {
    throw new ApiError('Session order must be populated')
  }

  const { order } = session

  if (order.paymentStatus !== OrderPaymentStatus.Authorized) {
    throw new ApiError('Order payment is not in authorized status')
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

  const refundAmount = order.totalPrice.amount * LATE_SESSION_REFUND_PERCENTAGE

  if (refundAmount === order.totalPrice.amount) {
    await releaseOrderFunds(order)
    return
  }

  const cancellationFee = round(order.totalPrice.amount - refundAmount, 2)
  const sessionOrderItem = order.items[0] as OrderItem<SessionOrderItem>

  const lateCancellationOrderItem: OrderItem<LateSessionSessionCancellationOrderItem> =
    {
      status: OrderItemStatus.Fulfilled,
      itemType: OrderItemType.LateSessionCancellation,
      totalPrice: {
        currencyCode: order.totalPrice.currencyCode,
        amount: cancellationFee,
      },
      data: { sessionOrderItem, refundAmount },
    }

  order.items = [lateCancellationOrderItem]

  if (stripeOrder.status === 'submitted') {
    stripeOrder = await stripe.orders.reopen(stripeOrder.id)
  }

  stripeOrder = await saveStripeOrder(order)

  stripeOrder = await stripe.orders.submit(stripeOrder.id, {
    expected_total: convertPriceToCents(order.totalPrice.amount),
  })

  const paymentMethod = order.paymentMethod as PaymentMethod
  const paymentIntentId = stripeOrder.payment.payment_intent as string

  let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

  if (
    paymentIntent.status === 'requires_action' ||
    paymentIntent.status === 'requires_payment_method'
  ) {
    paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethod.stripePaymentMethodId,
    })
  }

  paymentIntent = await stripe.paymentIntents.capture(paymentIntentId)

  order.refundStatus = OrderRefundStatus.PartialRefundCompleted
  order.paymentStatus = OrderPaymentStatus.Captured
  await order.save()
}
