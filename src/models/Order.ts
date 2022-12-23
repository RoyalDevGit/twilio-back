import mongoose, { Schema, Document, PaginateModel } from 'mongoose'
import mongooseAutopopulate from 'mongoose-autopopulate'
import mongoosePaginate from 'mongoose-paginate-v2'

import { pick } from 'utils/object/pick'
import { getEnumValues } from 'utils/enum/enumUtils'
import { ModelRef } from 'interfaces/ModelRef'
import { User } from 'models/User'
import { Price, PriceSchema } from 'models/Price'
import { PaymentMethod } from 'models/PaymentMethod'
import { Session } from 'models/Session'
import { calculateTotalOrderPrice } from 'utils/orders/calculateTotalOrderPrice'
import { calculateGrandTotalPrice } from 'utils/orders/calculateGrandTotalPrice'

export enum OrderStatus {
  Open = 'open',
  Paid = 'paid',
  Complete = 'complete',
  Cancelled = 'cancelled',
}

export enum OrderPaymentStatus {
  NotStarted = 'not_started',
  Authorized = 'authorized',
  FailedAuthorization = 'failed_auth',
  Captured = 'captured',
}

export enum OrderRefundStatus {
  RefundRequested = 'refund_requested',
  FullRefundCompleted = 'full_refund_completed',
  PartialRefundCompleted = 'partial_refund_completed',
}

export enum OrderItemStatus {
  Unfulfilled = 'unfulfilled',
  Fulfilled = 'fulfilled',
}

export enum OrderItemType {
  Session = 'session',
  SessionExtension = 'session_extension',
  LateSessionCancellation = 'late_session_cancellation',
}

export interface SessionOrderItem {
  startDate: {
    timeZone: string
    date: string
  }
  duration: number
  timeSlotId?: string
  expert: string
  consumer: string
  instant: boolean
  notes?: string
}

export interface SessionExtensionOrderItem {
  session: string
  duration: number
}

export interface LateSessionSessionCancellationOrderItem {
  sessionOrderItem: OrderItem<SessionOrderItem>
  refundAmount: number
}

export interface OrderItem<T = unknown> {
  itemType: OrderItemType
  status: OrderItemStatus
  data: T
  totalPrice: Price
}

const OrderItemSchema = new Schema<OrderItem>({
  itemType: { type: String, enum: getEnumValues(OrderItemType) },
  status: {
    type: String,
    enum: getEnumValues(OrderItemStatus),
    default: OrderItemStatus.Unfulfilled,
  },
  data: { type: Schema.Types.Mixed },
  totalPrice: { type: PriceSchema, required: true },
})

const serializeOrderItem = (settings: OrderItem): OrderItem =>
  pick(settings, 'itemType', 'status', 'data', 'totalPrice') as OrderItem

OrderItemSchema.methods.toJSON = function (
  this: OrderItem
): Partial<OrderItem> {
  return serializeOrderItem(this)
}

export interface Order extends Document {
  orderNumber: number
  status: OrderStatus
  paymentStatus: OrderPaymentStatus
  refundStatus?: OrderRefundStatus
  items: OrderItem[]
  totalPrice: Price
  paymentMethod?: ModelRef<PaymentMethod>
  stripeOrderId?: string
  stripeOrderClientSecret?: string | null
  updatedAt: Date
  createdAt: Date
  createdBy: ModelRef<User>
  isProcessing: boolean
  session?: Session
  parentOrder: ModelRef<Order>
  subOrders?: Order[]
  grandTotalPrice: Price
  paymentFailureDate?: Date
}

const OrderSchema = new Schema<Order, PaginateModel<Order>>(
  {
    orderNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: getEnumValues(OrderStatus),
      required: true,
      default: OrderStatus.Open,
    },
    paymentStatus: {
      type: String,
      enum: getEnumValues(OrderPaymentStatus),
      required: true,
      default: OrderPaymentStatus.NotStarted,
    },
    refundStatus: {
      type: String,
      enum: getEnumValues(OrderRefundStatus),
    },
    stripeOrderId: { type: String, trim: true },
    totalPrice: {
      type: PriceSchema,
      required: true,
      get: function (this: Order) {
        return calculateTotalOrderPrice(this)
      },
    },
    grandTotalPrice: {
      type: PriceSchema,
      required: true,
      get: function (this: Order) {
        return calculateGrandTotalPrice(this)
      },
    },
    items: {
      type: [{ type: OrderItemSchema }],
      default: [],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentMethod',
      autopopulate: true,
    },
    isProcessing: { type: Boolean, default: false },
    parentOrder: { type: Schema.Types.ObjectId, ref: 'Order' },
    paymentFailureDate: { type: Date },
  },
  { timestamps: true }
)

const serializeOrder = (order: Order): Order =>
  pick(
    order,
    'id',
    'orderNumber',
    'status',
    'paymentStatus',
    'refundStatus',
    'stripeOrderId',
    'stripeOrderClientSecret',
    'items',
    'paymentMethod',
    'totalPrice',
    'createdAt',
    'updatedAt',
    'createdBy',
    'session',
    'parentOrder',
    'subOrders',
    'grandTotalPrice',
    'paymentFailureDate'
  ) as Order

OrderSchema.methods.toJSON = function (this: Order): Partial<Order> {
  return serializeOrder(this)
}

OrderSchema.pre('validate', function (this: Order) {
  this.totalPrice = calculateTotalOrderPrice(this)
  this.grandTotalPrice = calculateGrandTotalPrice(this)
})

OrderSchema.plugin(mongooseAutopopulate)
OrderSchema.plugin(mongoosePaginate)

export const OrderModel = mongoose.model<Order, PaginateModel<Order>>(
  'Order',
  OrderSchema
)
