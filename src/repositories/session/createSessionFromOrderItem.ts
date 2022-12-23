import { DateTime } from 'luxon'

import { Order, OrderItem, SessionOrderItem } from 'models/Order'
import { SessionModel } from 'models/Session'
import { sessionPopulationPaths } from 'repositories/session/populateSession'
import { createChannelFromSession } from 'repositories/messaging/channel/createChannelFromSession'

export const createSessionFromOrderItem = async (
  item: OrderItem<SessionOrderItem>,
  order: Order
) => {
  const { data } = item

  const newSession = new SessionModel({
    duration: data.duration,
    instant: data.instant,
    startDate: {
      timeZone: data.startDate.timeZone,
      date: DateTime.fromISO(data.startDate.date).toJSDate(),
    },
    endDate: {
      timeZone: data.startDate.timeZone,
      date: DateTime.fromISO(data.startDate.date)
        .plus({ minutes: data.duration })
        .toJSDate(),
    },
    notes: data.notes,
    order,
    consumer: data.consumer,
    expert: data.expert,
    createdBy: order.createdBy,
  })

  await newSession.save()
  await newSession.populate(sessionPopulationPaths)

  newSession.messagingChannel = await createChannelFromSession(newSession)
  await newSession.save()

  return newSession
}
