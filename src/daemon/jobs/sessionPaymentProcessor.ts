import { PipelineStage } from 'mongoose'
import { serializeError } from 'serialize-error'

import { Order, OrderModel, OrderPaymentStatus } from 'models/Order'
import { Session, SessionAttendanceResult, SessionModel } from 'models/Session'
import { paginateAggregationPipeline } from 'utils/pagination/paginateAggregationPipeline'
import { getOrderById } from 'repositories/order/getOrderById'
import { captureOrderFunds } from 'commerceOperations/captureOrderFunds'
import { createLogger } from 'utils/logger/createLogger'
import { queueSessionCapturedPaymentNotification } from 'notifications/CapturedSessionPayment'
import { getSystemAccount } from 'repositories/user/getSystemAccount'
import { noticeError } from 'utils/newrelic/newrelic-utils'

interface AggregateResult {
  order: Order
  session: Session
}

const logger = createLogger('session-payment-processer')

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
        'order.paymentStatus': OrderPaymentStatus.Authorized,
        'order.parentOrder': null,
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
        'session.attendanceResult': SessionAttendanceResult.AllPresent,
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
      session.order = new OrderModel(result.order)
      return session
    },
  })

  return queryResponse.items
}

export const sessionPaymentProcessorJob = async () => {
  try {
    logger.info('Getting sessions ready for payment capture...')
    const systemAccount = await getSystemAccount()
    const sessions = await getOrdersToProcess()

    logger.info(`${sessions.length} sessions(s) found`)
    sessions.forEach(async (session) => {
      const parentOrder = (await getOrderById(session.order.id)) as Order
      const orders = [parentOrder]
      if (parentOrder.subOrders) {
        parentOrder.subOrders.forEach((subOrder) => {
          orders.push(subOrder)
        })
      }
      orders.forEach(async (unpopulatedOrder) => {
        try {
          const order = (await getOrderById(unpopulatedOrder.id)) as Order
          await captureOrderFunds(order)
          queueSessionCapturedPaymentNotification({
            currentUser: systemAccount,
            session: order.session as Session,
            order,
          })
        } catch (e) {
          const error = e as Error
          logger.error(
            `Could not capture payment for order ${unpopulatedOrder.id}. REASON: ${error.message}`,
            serializeError(error)
          )
          noticeError(e)
        }
      })
    })
  } catch (e) {
    noticeError(e)
    logger.error(serializeError(e))
  }
}
