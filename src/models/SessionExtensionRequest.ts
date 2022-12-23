import mongoose, { Schema, Document } from 'mongoose'
import mongooseAutopopulate from 'mongoose-autopopulate'

import { pick } from 'utils/object/pick'
import { getEnumValues } from 'utils/enum/enumUtils'
import { ModelRef } from 'interfaces/ModelRef'
import { User } from 'models/User'
import { Session } from 'models/Session'
import { Order } from 'models/Order'

export enum SessionExtensionRequestStatus {
  Requested = 'requested',
  Withdrawn = 'withdrawn',
  Declined = 'declined',
  Accepted = 'accepted',
  Complete = 'complete',
}

export interface SessionExtensionRequest extends Document {
  session: Session
  status: SessionExtensionRequestStatus
  maxDuration?: number
  duration?: number
  requester: ModelRef<User>
  replier?: ModelRef<User>
  order?: ModelRef<Order>
}

const SessionExtensionRequestSchema = new Schema<SessionExtensionRequest>(
  {
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    status: {
      type: String,
      enum: getEnumValues(SessionExtensionRequestStatus),
      required: true,
      default: SessionExtensionRequestStatus.Requested,
    },
    maxDuration: { type: Number },
    duration: { type: Number },
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    replier: { type: Schema.Types.ObjectId, ref: 'User' },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
)

const serializeOrder = (
  req: SessionExtensionRequest
): SessionExtensionRequest =>
  pick(
    req,
    'id',
    'session',
    'status',
    'maxDuration',
    'duration',
    'requester',
    'replier',
    'order'
  ) as SessionExtensionRequest

SessionExtensionRequestSchema.methods.toJSON = function (
  this: SessionExtensionRequest
): Partial<SessionExtensionRequest> {
  return serializeOrder(this)
}

SessionExtensionRequestSchema.plugin(mongooseAutopopulate)

export const SessionExtensionRequestModel =
  mongoose.model<SessionExtensionRequest>(
    'SessionExtensionRequest',
    SessionExtensionRequestSchema
  )
