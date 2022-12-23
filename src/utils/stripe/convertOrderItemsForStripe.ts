import Stripe from 'stripe'

import { OrderItem, OrderItemType } from 'models/Order'
import { Env } from 'utils/env'
import { convertPriceToCents } from 'utils/commerce/convertPriceToCents'

const STRIPE_EXPERT_SESSION_PRODUCT_ID = Env.getString(
  'STRIPE_EXPERT_SESSION_PRODUCT_ID'
)

const STRIPE_SESSION_EXTENSION_PRODUCT_ID = Env.getString(
  'STRIPE_SESSION_EXTENSION_PRODUCT_ID'
)

const STRIPE_LATE_SESSION_CANCELLATION_PRODUCT_ID = Env.getString(
  'STRIPE_LATE_SESSION_CANCELLATION_PRODUCT_ID'
)

export const getStripeProductId = (orderItem: OrderItem): string => {
  switch (orderItem.itemType) {
    case OrderItemType.Session:
      return STRIPE_EXPERT_SESSION_PRODUCT_ID
    case OrderItemType.SessionExtension:
      return STRIPE_SESSION_EXTENSION_PRODUCT_ID
    case OrderItemType.LateSessionCancellation:
      return STRIPE_LATE_SESSION_CANCELLATION_PRODUCT_ID
    default:
      throw new Error('Could not convert order item type to stripe product id')
  }
}

export const convertOrderItemsForStripe = (
  orderItems: OrderItem[]
): Stripe.OrderCreateParams.LineItem[] =>
  orderItems.map((item) => ({
    product: getStripeProductId(item),
    quantity: 1,
    price_data: {
      currency: item.totalPrice.currencyCode,
      unit_amount: convertPriceToCents(item.totalPrice.amount),
    },
  }))
