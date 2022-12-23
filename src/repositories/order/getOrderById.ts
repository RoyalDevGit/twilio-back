import { AggregateOptions } from 'mongoose'

import { orderPopulationPaths } from 'repositories/order/populateOrder'
import { OrderModel } from 'models/Order'
import { SessionModel } from 'models/Session'
import { sessionPopulationPaths } from 'repositories/session/populateSession'

type GetOrderByIdOptions = Pick<AggregateOptions, 'readPreference'>

export const getOrderById = async (
  orderId: string,
  options: GetOrderByIdOptions = {}
) => {
  const readPreference = options.readPreference as string | undefined
  const order = await OrderModel.findById(orderId, null, {
    readPreference,
  }).populate(orderPopulationPaths)

  if (!order) {
    return null
  }

  const subOrders = await OrderModel.find(
    {
      parentOrder: orderId,
    },
    null,
    {
      readPreference,
    }
  ).populate(orderPopulationPaths)
  order.subOrders = subOrders

  const session = await SessionModel.findOne({
    order: order.id,
  }).populate(sessionPopulationPaths)

  if (session) {
    order.session = session
  }
  return order
}
