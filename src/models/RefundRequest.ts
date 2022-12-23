import mongoose, { Schema, Document, PaginateModel } from 'mongoose'
import mongooseAutopopulate from 'mongoose-autopopulate'
import mongoosePaginate from 'mongoose-paginate-v2'

import { pick } from 'utils/object/pick'
import { getEnumValues } from 'utils/enum/enumUtils'
import { ModelRef } from 'interfaces/ModelRef'
import { User } from 'models/User'
import { Order, OrderRefundStatus } from 'models/Order'

export interface RefundRequest extends Document {
  status: OrderRefundStatus
  order: ModelRef<Order>
  description: string
  updatedAt: Date
  createdAt: Date
  createdBy: ModelRef<User>
}

const RefundRequestSchema = new Schema<
  RefundRequest,
  PaginateModel<RefundRequest>
>(
  {
    status: {
      type: String,
      enum: getEnumValues(OrderRefundStatus),
      default: OrderRefundStatus.RefundRequested,
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      autopopulate: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

const serializeRefundRequest = (order: RefundRequest): RefundRequest =>
  pick(
    order,
    'id',
    'status',
    'order',
    'description',
    'createdBy',
    'createdAt',
    'updatedAt'
  ) as RefundRequest

RefundRequestSchema.methods.toJSON = function (
  this: RefundRequest
): Partial<RefundRequest> {
  return serializeRefundRequest(this)
}

RefundRequestSchema.plugin(mongooseAutopopulate)
RefundRequestSchema.plugin(mongoosePaginate)

export const RefundRequestModel = mongoose.model<
  RefundRequest,
  PaginateModel<RefundRequest>
>('RefundRequest', RefundRequestSchema)
