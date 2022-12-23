import { Order } from 'models/Order'
import { Price } from 'models/Price'

export const calculateGrandTotalPrice = (order: Order) => {
  const grandTotalPrice: Price = {
    currencyCode: 'USD',
    amount: order.totalPrice.amount,
  }

  order.subOrders?.forEach((co) => {
    grandTotalPrice.amount += co.totalPrice.amount
  })

  return grandTotalPrice
}
