import { Order } from 'models/Order'
import { Price } from 'models/Price'

export const calculateTotalOrderPrice = (order: Order) => {
  const totalPrice: Price = {
    currencyCode: 'USD',
    amount: 0,
  }

  order.items.forEach((lineItem) => {
    totalPrice.amount = totalPrice.amount + lineItem.totalPrice.amount
  })

  return totalPrice
}
