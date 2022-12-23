import { DateTime } from 'luxon'
import { isObject } from 'lodash'

import { Expert, ExpertModel } from 'models/Expert'
import {
  Order,
  OrderItem,
  OrderItemType,
  SessionExtensionOrderItem,
  SessionOrderItem,
} from 'models/Order'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'
import { getExpertAvailability } from 'repositories/expert/getExpertAvailability'
import { PaymentMethod } from 'models/PaymentMethod'
import { getExpertInstantAvailability } from 'repositories/expert/getExpertInstantAvailability'
import { getSessionById } from 'repositories/session/getSessionById'
import { getCurrentSessionExtension } from 'repositories/session/getCurrentSessionExtension'
import { User } from 'models/User'

export const validateOrderForProcessing = async (order: Order) => {
  if (!order.paymentMethod) {
    throw new ApiError('orderHasNotPaymentMethod', ApiErrorCode.BadRequest)
  }

  const paymentMethod = order.paymentMethod as PaymentMethod

  if (!paymentMethod.stripePaymentMethodId) {
    throw new ApiError('missingGatewayPaymentMethod', ApiErrorCode.BadRequest)
  }

  if (!isObject(order.createdBy)) {
    throw new ApiError('orderUserMustBePopulated', ApiErrorCode.BadRequest)
  }

  const itemValidationPromises = order.items.map(async (item) => {
    if (item.itemType === OrderItemType.Session) {
      const sessionOrderItem = item as OrderItem<SessionOrderItem>
      const {
        expert: expertId,
        startDate,
        duration,
        timeSlotId,
        instant,
      } = sessionOrderItem.data
      const expert = await ExpertModel.findById(expertId)
      if (!expert) {
        throw new ApiError('expertNotFound', ApiErrorCode.Forbidden)
      }
      const startDateTime = DateTime.fromISO(startDate.date)

      if (instant) {
        const availableDurations = await getExpertInstantAvailability(
          expert,
          DateTime.now()
        )
        return !!availableDurations.find((d) => d.minutes === duration)
      }
      const endTime = startDateTime.plus({ minutes: duration })
      const availability = await getExpertAvailability(
        expert,
        order.createdBy as User,
        {
          from: startDateTime.minus({ weeks: 1 }),
          to: endTime.plus({ weeks: 1 }),
          includeAllTimeSlots: true,
        }
      )

      return !!availability.timeSlots.find((ts) => ts.id === timeSlotId)
    }

    if (item.itemType === OrderItemType.SessionExtension) {
      const extensionOrderItem = item as OrderItem<SessionExtensionOrderItem>
      const { session: sessionId, duration } = extensionOrderItem.data
      const session = await getSessionById(sessionId)
      if (!session) {
        throw new ApiError('sessionNotFound', ApiErrorCode.Forbidden)
      }
      const currentExtension = await getCurrentSessionExtension(session.id)
      if (!currentExtension) {
        throw new ApiError(
          'noOngoingSessionExtensionRequest',
          ApiErrorCode.Forbidden
        )
      }
      let availableDurations = await getExpertInstantAvailability(
        session.expert as Expert,
        DateTime.now(),
        { ignoreActiveSession: true }
      )

      if (currentExtension.maxDuration) {
        availableDurations = availableDurations.filter(
          (d) => d.minutes <= (currentExtension.maxDuration as number)
        )
      }
      return !!availableDurations.find((d) => d.minutes === duration)
    }
  })

  const itemValidationResults = await Promise.all(itemValidationPromises)

  if (itemValidationResults.includes(false)) {
    throw new ApiError('timeSlotIsNoLongerAvailable', ApiErrorCode.Expired)
  }
}
