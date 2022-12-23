import { OrderModel, OrderStatus } from 'models/Order'
import { User } from 'models/User'

export const getCurrentOrderByUser = (user: User) =>
  OrderModel.findOne(
    {
      status: OrderStatus.Open,
      createdBy: user.id,
    },
    null,
    { readPreference: 'primary' }
  )
