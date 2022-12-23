import isObject from 'lodash/isObject'

import { stripe } from 'apis/Stripe'
import { Order } from 'models/Order'
import { User } from 'models/User'
import { convertOrderItemsForStripe } from 'utils/stripe/convertOrderItemsForStripe'
import { createStripeCustomerIfNecessary } from 'utils/stripe/stripeCustomer'

export const saveStripeOrder = async (order: Order) => {
  const user = order.createdBy as User

  if (!isObject(order.createdBy)) {
    throw new Error('The createdBy property of the order must be populated')
  }

  await createStripeCustomerIfNecessary(user)

  if (order.stripeOrderId) {
    let stripeOrder = await stripe.orders.retrieve(order.stripeOrderId)
    if (stripeOrder.status !== 'open') {
      throw new Error('Only open orders can be updated')
    }
    stripeOrder = await stripe.orders.update(order.stripeOrderId, {
      line_items: convertOrderItemsForStripe(order.items),
    })
    return stripeOrder
  }

  const stripeOrder = await stripe.orders.create({
    customer: user.stripeId,
    currency: 'usd',
    line_items: convertOrderItemsForStripe(order.items),
    payment: {
      settings: {
        payment_method_types: ['card'],
        payment_method_options: {
          card: {
            capture_method: 'manual',
          },
        },
      },
    },
    metadata: {
      expertSessionOrderId: order.id,
    },
  })

  order.stripeOrderId = stripeOrder.id
  order.stripeOrderClientSecret = stripeOrder.client_secret
  await order.save()

  return stripeOrder
}
