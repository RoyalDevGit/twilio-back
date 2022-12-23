import { Schema } from 'mongoose'

import { pick } from 'utils/object/pick'

export interface Price {
  amount: number
  currencyCode: string
}

export const PriceSchema = new Schema<Price>({
  amount: { type: Number, required: true },
  currencyCode: { type: String, required: true },
})

const serializePrice = (price: Price): Price =>
  pick(price, 'amount', 'currencyCode') as Price

PriceSchema.methods.toJSON = function (this: Price): Partial<Price> {
  return serializePrice(this)
}
