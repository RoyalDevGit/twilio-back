import { DateTime } from 'luxon'
import { PipelineStage } from 'mongoose'
import { serializeError } from 'serialize-error'

import { OrderModel, OrderPaymentStatus, OrderStatus } from 'models/Order'
import { Session, SessionModel, SessionStatus } from 'models/Session'
import { paginateAggregationPipeline } from 'utils/pagination/paginateAggregationPipeline'
import { Env } from 'utils/env'
import { getSessionById } from 'repositories/session/getSessionById'
import { createLogger } from 'utils/logger/createLogger'
import { getSystemAccount } from 'repositories/user/getSystemAccount'
import { queueFailedPaymentSessionCancellationNotifications } from 'notifications/cancelledSession/FailedPaymentSessionCancellationDue'
import { noticeError } from 'utils/newrelic/newrelic-utils'

const FAILED_SESSION_PAYMENT_AUTOMATIC_CANCELLATION_WINDOW = Env.getDuration(
  'FAILED_SESSION_PAYMENT_AUTOMATIC_CANCELLATION_WINDOW'
)

interface AggregateResult {
  session: Session
}

const logger = createLogger('unpaid-session-canceller')

const getSessionsToProcess = async () => {
  const minDate = DateTime.now().minus({
    hours: FAILED_SESSION_PAYMENT_AUTOMATIC_CANCELLATION_WINDOW.as('hours'),
  })

  const pipeline: PipelineStage[] = [
    {
      $project: {
        _id: 0.0,
        order: '$$ROOT',
      },
    },
    {
      $match: {
        'order.status': { $ne: OrderStatus.Cancelled },
        'order.paymentStatus': OrderPaymentStatus.FailedAuthorization,
        'order.paymentFailureDate': {
          $exists: true,
          $lte: minDate.toJSDate(),
        },
      },
    },
    {
      $lookup: {
        from: 'sessions',
        localField: 'order._id',
        foreignField: 'order',
        as: 'session',
      },
    },
    {
      $unwind: {
        path: '$session',
        preserveNullAndEmptyArrays: false,
      },
    },
  ]

  const queryResponse = await paginateAggregationPipeline<
    Session,
    AggregateResult
  >({
    readPreference: 'primary',
    model: OrderModel,
    paginationRequest: {
      page: 1,
      limit: 500,
      sort: 'order.createdAt',
      sortDirection: 'asc',
    },
    pipeline,
    resultMapper: (result) => {
      const session = new SessionModel(result.session)
      return session
    },
  })

  return queryResponse.items
}

export const unpaidSessionCancellerJob = async () => {
  try {
    logger.info('Getting sessions ready for authorization...')
    const systemAccount = await getSystemAccount()
    const sessions = await getSessionsToProcess()

    logger.info(`${sessions.length} session(s) found`)
    sessions.forEach(async (unpopulatedSession) => {
      try {
        const session = (await getSessionById(unpopulatedSession.id)) as Session
        const { order } = session

        session.status = SessionStatus.Cancelled
        await session.save()

        order.status = OrderStatus.Cancelled
        await order.save()

        await queueFailedPaymentSessionCancellationNotifications({
          currentUser: systemAccount,
          session,
        })
      } catch (e) {
        const error = e as Error
        logger.error(
          `Could not automatically cancel session ${unpopulatedSession.id}. REASON: ${error.message}`,
          serializeError(error)
        )
        noticeError(e)
      }
    })
  } catch (e) {
    noticeError(e)
    logger.error(serializeError(e))
  }
}
