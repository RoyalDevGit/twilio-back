import { ObjectIdLike } from 'interfaces/ModelRef'
import { SessionModel } from 'models/Session'
import { orderPopulationPaths } from 'repositories/order/populateOrder'
import { sessionPopulationPaths } from 'repositories/session/populateSession'

export const getSessionById = async (sessionId: ObjectIdLike) => {
  const session = await SessionModel.findById(sessionId).populate(
    sessionPopulationPaths
  )
  if (session?.order) {
    session?.order.populate(orderPopulationPaths)
  }
  return session
}

export const getSessionByOrderId = async (orderId: ObjectIdLike) => {
  const session = await SessionModel.findOne({ order: orderId })
  return session
}
