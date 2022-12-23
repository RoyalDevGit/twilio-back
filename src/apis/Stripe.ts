import Stripe from 'stripe'

import { Env } from 'utils/env'

const STRIPE_SECRET_KEY = Env.getString('STRIPE_SECRET_KEY')
const STRIPE_API_VERSION = Env.getString('STRIPE_API_VERSION')

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  apiVersion: STRIPE_API_VERSION,
})
