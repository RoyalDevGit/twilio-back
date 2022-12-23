import { Order, OrderPaymentStatus } from 'models/Order'
import { Session, SessionStatus } from 'models/Session'
import { convertEventDateToDateTime } from 'utils/date/convertEventDateToDateTime'
import { Env } from 'utils/env'
import { isPastSession } from 'utils/sessions/isPastSession'

const SESSION_ALLOWED_EARLY_ARRIVAL_WINDOW = Env.getDuration(
  'SESSION_ALLOWED_EARLY_ARRIVAL_WINDOW'
)

type SessionNotJoinableReason =
  | 'ended'
  | 'cancelled'
  | 'past'
  | 'too_early'
  | 'no_payment'
  | 'failed_payment'

export interface SessionJoinableResult {
  joinable: boolean
  reason?: SessionNotJoinableReason
}

export const isSessionJoinable = (
  session: Session,
  order?: Order
): SessionJoinableResult => {
  const sessionOrder = order || session.order
  if (sessionOrder.paymentStatus === OrderPaymentStatus.FailedAuthorization) {
    return { joinable: false, reason: 'failed_payment' }
  }

  if (session.ended) {
    return { joinable: false, reason: 'ended' }
  }
  if (session.status === SessionStatus.Cancelled) {
    return { joinable: false, reason: 'cancelled' }
  }

  const startDate = convertEventDateToDateTime(session.startDate)

  // if end date is in the past
  if (isPastSession(session)) {
    return { joinable: false, reason: 'past' }
  }

  if (session.status === SessionStatus.Active) {
    return { joinable: true }
  }

  const secondsUntilStart = startDate.diffNow(['seconds']).seconds

  const isEarlyJoin =
    secondsUntilStart > SESSION_ALLOWED_EARLY_ARRIVAL_WINDOW.as('seconds')
  if (isEarlyJoin) {
    return { joinable: false, reason: 'too_early' }
  }

  if (sessionOrder.paymentStatus !== OrderPaymentStatus.Authorized) {
    return { joinable: false, reason: 'no_payment' }
  }

  return {
    joinable: true,
  }
}
