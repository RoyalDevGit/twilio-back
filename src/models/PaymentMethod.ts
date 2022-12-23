import mongoose, { Schema, Document, PaginateModel } from 'mongoose'
import mongooseAutopopulate from 'mongoose-autopopulate'
import mongoosePaginate from 'mongoose-paginate-v2'

import { pick } from 'utils/object/pick'
import { getEnumValues } from 'utils/enum/enumUtils'
import { ModelRef } from 'interfaces/ModelRef'
import { User } from 'models/User'

export enum PaymentMethodStatus {
  Incomplete = 'incomplete',
  Ready = 'ready',
  Deleted = 'deleted',
}

export enum PaymentMethodType {
  CreditCard = 'credit_card',
}

export interface CardPaymentMethod {
  brand: string
  last4: string
  expirationMonth: number
  expirationYear: number
  funding: string
}

const CardPaymentMethodSchema = new Schema<CardPaymentMethod>({
  brand: { type: String, trim: true, required: true },
  last4: { type: String, trim: true, required: true },
  expirationMonth: { type: Number, trim: true, required: true },
  expirationYear: { type: Number, trim: true, required: true },
  funding: { type: String, trim: true, required: true },
})

const serializeCardPaymentMethod = (
  paymentMethod: CardPaymentMethod
): CardPaymentMethod =>
  pick(
    paymentMethod,
    'brand',
    'last4',
    'expirationMonth',
    'expirationYear',
    'funding'
  ) as CardPaymentMethod

CardPaymentMethodSchema.methods.toJSON = function (
  this: CardPaymentMethod
): Partial<CardPaymentMethod> {
  return serializeCardPaymentMethod(this)
}

export interface PaymentMethod extends Document {
  status: PaymentMethodStatus
  paymentMethodType: PaymentMethodType
  stripeSetupIntentId: string
  stripeSetupIntentClientSecret: string | null
  stripePaymentMethodId?: string
  card?: CardPaymentMethod
  preferred: boolean
  createdBy: ModelRef<User>
  updatedAt: Date
  createdAt: Date
}

const PaymentMethodSchema = new Schema<
  PaymentMethod,
  PaginateModel<PaymentMethod>
>(
  {
    status: {
      type: String,
      enum: getEnumValues(PaymentMethodStatus),
      required: true,
      default: PaymentMethodStatus.Incomplete,
    },
    paymentMethodType: {
      type: String,
      enum: getEnumValues(PaymentMethodType),
      required: true,
    },
    preferred: { type: Boolean, default: false },
    stripeSetupIntentId: { type: String, trim: true, immutable: true },
    stripePaymentMethodId: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    card: { type: CardPaymentMethodSchema },
  },
  { timestamps: true }
)

const serializePaymentMethod = (paymentMethod: PaymentMethod): PaymentMethod =>
  pick(
    paymentMethod,
    'id',
    'status',
    'paymentMethodType',
    'stripeSetupIntentId',
    'stripeSetupIntentClientSecret',
    'stripePaymentMethodId',
    'createdAt',
    'updatedAt',
    'createdBy',
    'preferred',
    'card'
  ) as PaymentMethod

PaymentMethodSchema.methods.toJSON = function (
  this: PaymentMethod
): Partial<PaymentMethod> {
  return serializePaymentMethod(this)
}

PaymentMethodSchema.plugin(mongooseAutopopulate)
PaymentMethodSchema.plugin(mongoosePaginate)

export const PaymentMethodModel = mongoose.model<
  PaymentMethod,
  PaginateModel<PaymentMethod>
>('PaymentMethod', PaymentMethodSchema)
