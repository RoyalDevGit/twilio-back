import { DateTime } from 'luxon'

import { Env } from 'utils/env'

const STRIPE_PAYMENT_AUTH_WINDOW = Env.getDuration('STRIPE_PAYMENT_AUTH_WINDOW')

export const checkIfWithinPaymentAuthWindow = (date: DateTime) => {
  const { days } = date.diffNow(['days'])

  return days <= STRIPE_PAYMENT_AUTH_WINDOW.as('days')
}
