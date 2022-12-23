import Stripe from 'stripe'

import { stripe } from 'apis/Stripe'
import { PaymentMethod } from 'models/PaymentMethod'

export const applyStripePaymentMethodDetails = async (
  paymentMethod: PaymentMethod,
  stripePaymentMethod?: Stripe.PaymentMethod
) => {
  if (!stripePaymentMethod) {
    if (!paymentMethod.stripePaymentMethodId) {
      return
    }
    stripePaymentMethod = await stripe.paymentMethods.retrieve(
      paymentMethod.stripePaymentMethodId
    )
  }
  paymentMethod.stripePaymentMethodId = stripePaymentMethod.id
  if (stripePaymentMethod.card) {
    const { card } = stripePaymentMethod
    paymentMethod.card = {
      ...(paymentMethod.card || {}),
      brand: card.brand,
      last4: card.last4,
      expirationMonth: card.exp_month,
      expirationYear: card.exp_year,
      funding: card.funding,
    }
  }
}
