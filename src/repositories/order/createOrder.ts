import { Request } from 'express'

import { AuthenticatedRequest } from 'interfaces/Express'
import { Order, OrderItem, OrderModel } from 'models/Order'
import {
  PaymentMethod,
  PaymentMethodModel,
  PaymentMethodStatus,
} from 'models/PaymentMethod'
import { SequenceLedgerKey } from 'models/SequenceLedger'
import { getCurrentOrderByUser } from 'repositories/order/getCurrentOrderByUser'
import { getOrderById } from 'repositories/order/getOrderById'
import { getNextInSequence } from 'repositories/sequenceLedger/getNextInSequence'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'

export interface PartialOrderData extends Omit<Partial<Order>, 'items'> {
  items: Partial<OrderItem>[]
}

interface CreateOrderOptions {
  req: Request
  orderData: PartialOrderData
}

export const createOrder = async ({
  req,
  orderData,
}: CreateOrderOptions): Promise<Order> => {
  const appReq = req as AuthenticatedRequest
  const { user } = appReq

  const currentOrder = await getCurrentOrderByUser(user)

  if (currentOrder) {
    throw new ApiError('userAlreadyHasAnOpenOrder', ApiErrorCode.AlreadyExists)
  }

  let paymentMethod: PaymentMethod | null = null
  if (orderData.paymentMethod) {
    paymentMethod = await PaymentMethodModel.findById(orderData.paymentMethod)
    if (
      !paymentMethod ||
      paymentMethod.status === PaymentMethodStatus.Deleted
    ) {
      throw new ApiError('paymentMethodNotFound', ApiErrorCode.NotFound)
    }
    if (paymentMethod.status !== PaymentMethodStatus.Ready) {
      throw new ApiError('paymentMethodNotReady', ApiErrorCode.BadRequest)
    }
  }

  const newOrderId = await getNextInSequence(SequenceLedgerKey.Order)
  const newOrder = new OrderModel({
    orderNumber: newOrderId,
    ...orderData,
    createdBy: user.id,
  })

  await newOrder.save()

  const populatedOrder = await getOrderById(newOrder.id, {
    readPreference: 'primary',
  })

  return populatedOrder as Order
}
