import { DateTime } from 'luxon'

import { Env } from 'utils/env'

const WINDOW_FOR_FULL_SESSION_REFUND = Env.getDuration(
  'WINDOW_FOR_FULL_SESSION_REFUND'
)

export const checkIfWithinFullRefundCancellationWindow = (date: DateTime) => {
  const { hours: hoursUntilSession } = date.diffNow(['hours'])

  return hoursUntilSession >= WINDOW_FOR_FULL_SESSION_REFUND.as('hours')
}
