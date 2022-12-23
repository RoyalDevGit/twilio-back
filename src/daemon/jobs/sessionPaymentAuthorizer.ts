import { DateTime } from 'luxon'
import { PipelineStage } from 'mongoose'
import { serializeError } from 'serialize-error'

import {
  Order,
  OrderModel,
  OrderPaymentStatus,
  OrderStatus,
} from 'models/Order'
import { Session, SessionStatus } from 'models/Session'
import { paginateAggregationPipeline } from 'utils/pagination/paginateAggregationPipeline'
import { Env } from 'utils/env'
import { queueSessionFailedPaymentNotification } from 'notifications/FailedSessionPayment'
import { getSessionById } from 'repositories/session/getSessionById'
import { holdOrderFunds } from 'commerceOperations/holdOrderFunds'
import { getOrderById } from 'repositories/order/getOrderById'
import { createLogger } from 'utils/logger/createLogger'
import { getSystemAccount } from 'repositories/user/getSystemAccount'
import { noticeError } from 'utils/newrelic/newrelic-utils'

const STRIPE_PAYMENT_AUTH_WINDOW = Env.getDuration('STRIPE_PAYMENT_AUTH_WINDOW')

interface AggregateResult {
  order: Order
}

const logger = createLogger('session-payment-authorizer')

const getOrdersToProcess = async () => {
  const pipeline: PipelineStage[] = [
    {
      $project: {
        _id: 0.0,
        order: '$$ROOT',
      },
    },
    {
      $match: {
        'order.status': OrderStatus.Complete,
        'order.paymentStatus': OrderPaymentStatus.NotStarted,
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
    {
      $match: {
        'session.startDate.date': {
          $lte: DateTime.now()
            .plus({
              days: STRIPE_PAYMENT_AUTH_WINDOW.as('days'),
            })
            .toJSDate(),
        },
        'session.status': { $ne: SessionStatus.Cancelled },
        'order.status': OrderStatus.Complete,
        'order.paymentStatus': OrderPaymentStatus.NotStarted,
      },
    },
  ]

  const queryResponse = await paginateAggregationPipeline<
    Order,
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
      const order = new OrderModel(result.order)
      return order
    },
  })

  return queryResponse.items
}

export const sessionPaymentAuthorizerJob = async () => {
  try {
    logger.info('Getting orders ready for authorization...')
    const systemAccount = await getSystemAccount()
    const orders = await getOrdersToProcess()

    logger.info(`${orders.length} order(s) found`)
    orders.forEach(async (unpopulatedOrder) => {
      const order = (await getOrderById(unpopulatedOrder.id)) as Order
      const parentOrder = order.parentOrder as Order | undefined
      let session: Session
      if (parentOrder) {
        session = parentOrder.session as Session
      } else {
        session = order.session as Session
      }
      if (!session) {
        logger.warn(`No associated session found for order ${order.id}`)
        return
      }

      try {
        await holdOrderFunds(order)
      } catch (e) {
        const error = e as Error
        logger.error(
          `Could not authorize payment for order ${order.id}. REASON: ${error.message}`,
          serializeError(error)
        )
        noticeError(e)
        await OrderModel.findByIdAndUpdate(order.id, {
          paymentStatus: OrderPaymentStatus.FailedAuthorization,
          paymentFailureDate: DateTime.now().toUTC().toJSDate(),
        })

        const populatedSession = (await getSessionById(session.id)) as Session
        await queueSessionFailedPaymentNotification({
          currentUser: systemAccount,
          session: populatedSession,
          order: populatedSession.order,
        })
      }
    })
  } catch (e) {
    noticeError(e)
    logger.error(serializeError(e))
  }
}
