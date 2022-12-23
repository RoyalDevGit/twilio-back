import { AggregateOptions, AnyObject, PipelineStage, Types } from 'mongoose'
import { DateTime } from 'luxon'

import { Order, OrderModel, OrderStatus } from 'models/Order'
import { PaymentMethod, PaymentMethodModel } from 'models/PaymentMethod'
import { paginateAggregationPipeline } from 'utils/pagination/paginateAggregationPipeline'
import { QueryRequest } from 'interfaces/Query'
import { Session, SessionModel, SessionStatus } from 'models/Session'
import { Expert, ExpertModel } from 'models/Expert'
import { User, UserModel } from 'models/User'
import { FileTracker, FileTrackerModel } from 'models/FileTracker'
import { paramValueAsArray } from 'utils/http/paramValueAsArray'
import {
  MessagingChannel,
  MessagingChannelModel,
} from 'models/MessagingChannel'

export type OrdersQueryOnly = 'parents' | 'children'

export interface QueryOrdersOptions
  extends QueryRequest,
    Pick<AggregateOptions, 'readPreference'> {
  orderId?: string
  createdBy?: string
  from?: DateTime
  to?: DateTime
  status?: OrderStatus[] | OrderStatus
  sessionStatus?: SessionStatus[] | SessionStatus
  only?: OrdersQueryOnly
  sessionStart?: string
  sessionEnd?: string
}

interface AggregateResult {
  order: Order
  subOrders: Order[]
  session?: Session
  messagingChannel?: MessagingChannel
  paymentMethod?: PaymentMethod
  consumer?: User
  consumerProfilePicture?: FileTracker
  expert?: Expert
  expertUser?: User
  expertProfilePicture?: FileTracker
}

export const queryOrders = async ({
  page,
  limit,
  sort = 'order.orderNumber',
  sortDirection = 'desc',
  orderId,
  createdBy,
  from,
  to,
  status,
  sessionStatus,
  readPreference,
  sessionStart,
  sessionEnd,
  only,
}: QueryOrdersOptions) => {
  let matchQuery: AnyObject = {}
  if (orderId) {
    matchQuery = {
      ...matchQuery,
      'order._id': new Types.ObjectId(orderId),
    }
  }
  if (createdBy) {
    matchQuery = {
      ...matchQuery,
      'order.createdBy': new Types.ObjectId(createdBy),
    }
  }
  if (from && to) {
    matchQuery = {
      ...matchQuery,
      'order.createdAt': {
        $gte: from,
        $lte: to,
      },
    }
  }

  if (status) {
    matchQuery = {
      ...matchQuery,
      'order.status': {
        $in: paramValueAsArray(status),
      },
    }
  }

  if (only) {
    switch (only) {
      case 'parents':
        matchQuery = {
          ...matchQuery,
          'order.parentOrder': null,
        }
        break
      case 'children':
        matchQuery = {
          ...matchQuery,
          'order.parentOrder': { $ne: null },
        }
        break
    }
  }

  const pipeline: PipelineStage[] = [
    {
      $project: {
        _id: 0.0,
        order: '$$ROOT',
      },
    },
    {
      $match: {
        ...matchQuery,
      },
    },
    {
      $lookup: {
        from: 'paymentmethods',
        localField: 'order.paymentMethod',
        foreignField: '_id',
        as: 'paymentMethod',
      },
    },
    {
      $unwind: {
        path: '$paymentMethod',
        preserveNullAndEmptyArrays: true,
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
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'session.consumer',
        foreignField: '_id',
        as: 'consumer',
      },
    },
    {
      $unwind: {
        path: '$consumer',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'experts',
        localField: 'session.expert',
        foreignField: '_id',
        as: 'expert',
      },
    },
    {
      $unwind: {
        path: '$expert',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'expert.user',
        foreignField: '_id',
        as: 'expertUser',
      },
    },
    {
      $unwind: {
        path: '$expertUser',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'filetrackers',
        localField: 'consumer.profilePicture',
        foreignField: '_id',
        as: 'consumerProfilePicture',
      },
    },
    {
      $unwind: {
        path: '$consumerProfilePicture',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'filetrackers',
        localField: 'expertUser.profilePicture',
        foreignField: '_id',
        as: 'expertProfilePicture',
      },
    },
    {
      $unwind: {
        path: '$expertProfilePicture',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'messagingchannels',
        localField: 'session.messagingChannel',
        foreignField: '_id',
        as: 'messagingChannel',
      },
    },
    {
      $unwind: {
        path: '$messagingChannel',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'orders',
        localField: 'order._id',
        foreignField: 'parentOrder',
        as: 'subOrders',
      },
    },
  ]

  if (sessionStatus) {
    pipeline.push({
      $match: {
        'session.status': {
          $in: paramValueAsArray(sessionStatus),
        },
      },
    })
  }

  if (sessionStart && sessionEnd) {
    pipeline.push({
      $match: {
        'session.startDate.date': {
          $gte: new Date(sessionStart),
          $lte: new Date(sessionEnd),
        },
      },
    })
  }

  const queryResponse = await paginateAggregationPipeline<
    Order,
    AggregateResult
  >({
    readPreference,
    model: OrderModel,
    paginationRequest: { page, limit, sort, sortDirection },
    pipeline,
    resultMapper: (result) => {
      const order = new OrderModel(result.order)

      if (result.paymentMethod) {
        order.paymentMethod = new PaymentMethodModel(result.paymentMethod)
      }

      if (result.session) {
        order.session = new SessionModel(result.session)

        if (result.consumer) {
          order.session.consumer = new UserModel(result.consumer)

          if (result.consumerProfilePicture) {
            order.session.consumer.profilePicture = new FileTrackerModel(
              result.consumerProfilePicture
            )
          }
        }

        if (result.expert) {
          order.session.expert = new ExpertModel(result.expert)
          order.session.expert.user = new UserModel(result.expertUser)

          if (result.expertProfilePicture) {
            order.session.expert.user.profilePicture = new FileTrackerModel(
              result.expertProfilePicture
            )
          }
        }

        if (result.messagingChannel) {
          const channel = new MessagingChannelModel(result.messagingChannel)
          channel.participants = result.messagingChannel.participants.map(
            (p) => {
              const userId = p.toString()
              const sessionConsumer = order.session?.consumer as User
              const sessionExpert = order.session?.expert as Expert
              if (sessionConsumer.id === userId) {
                return sessionConsumer
              }
              return sessionExpert.user as User
            }
          )

          order.session.messagingChannel = channel
        }
      }

      order.subOrders = result.subOrders.map((co) => new OrderModel(co))

      return order
    },
  })

  return queryResponse
}
