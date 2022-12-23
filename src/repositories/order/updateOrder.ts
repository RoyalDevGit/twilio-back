import { Order, OrderModel } from 'models/Order'
import { PartialOrderData } from 'repositories/order/createOrder'
import { getOrderById } from 'repositories/order/getOrderById'
import { ApiError, ApiErrorCode } from 'utils/error/ApiError'

interface UpdateOrderOptions {
  orderId: string
  updateData: PartialOrderData
}

export const updateOrder = async ({
  orderId,
  updateData,
}: UpdateOrderOptions): Promise<Order> => {
  const updatedOrder = await OrderModel.findByIdAndUpdate(orderId, updateData, {
    runValidators: true,
    new: true,
  })

  if (!updatedOrder) {
    throw new ApiError('orderNotFound', ApiErrorCode.NotFound)
  }

  const populatedOrder = await getOrderById(orderId, {
    readPreference: 'primary',
  })

  return populatedOrder as Order
}
