import mongoose, { Schema, Document, PaginateModel } from 'mongoose'
import mongooseAutopopulate from 'mongoose-autopopulate'

import { ModelRef } from 'interfaces/ModelRef'
import { pick } from 'utils/object/pick'
import { User } from 'models/User'
import { getEnumValues } from 'utils/enum/enumUtils'
import {
  MessagingChannel,
  MessagingChannelStatus,
} from 'models/MessagingChannel'

export interface UserMessagingChannel extends Document {
  channel: ModelRef<MessagingChannel>
  user: ModelRef<User>
  unreadCount: number
  status: MessagingChannelStatus
}

const UserMessagingChannelSchema = new Schema<
  UserMessagingChannel,
  PaginateModel<UserMessagingChannel>
>(
  {
    channel: {
      type: Schema.Types.ObjectId,
      ref: 'MessagingChannel',
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    unreadCount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: getEnumValues(MessagingChannelStatus),
      required: true,
      default: MessagingChannelStatus.Closed,
    },
  },
  { timestamps: true }
)

const serializeUserMessagingChannel = (
  userMessagingChannel: Partial<UserMessagingChannel>
): Partial<UserMessagingChannel> =>
  pick(
    userMessagingChannel,
    'id',
    'channel',
    'user',
    'status',
    'unreadCount'
  ) as Partial<UserMessagingChannel>

UserMessagingChannelSchema.methods.toJSON = function (
  this: UserMessagingChannel
): Partial<UserMessagingChannel> {
  return serializeUserMessagingChannel(this)
}

UserMessagingChannelSchema.plugin(mongooseAutopopulate)

export const UserMessagingChannelModel = mongoose.model<
  UserMessagingChannel,
  PaginateModel<UserMessagingChannel>
>('UserMessagingChannel', UserMessagingChannelSchema)
