import mongoose, { Schema, Document, PaginateModel } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import mongooseAutopopulate from 'mongoose-autopopulate'

import { ModelRef } from 'interfaces/ModelRef'
import { pick } from 'utils/object/pick'
import { User } from 'models/User'
import { ChannelMessage } from 'interfaces/ChannelMessage'
import { Session } from 'models/Session'

export enum MessagingChannelStatus {
  Open = 'open',
  Minimized = 'minimized',
  Closed = 'closed',
  Deleted = 'deleted',
}

export interface MessagingChannel extends Document {
  chimeChatChannelArn: string
  participants: ModelRef<User>[]
  unreadCount: number
  status: MessagingChannelStatus
  lastMessage?: ChannelMessage
  session?: Session
}

const MessagingChannelSchema = new Schema<
  MessagingChannel,
  PaginateModel<MessagingChannel>
>(
  {
    chimeChatChannelArn: { type: String, trim: true, required: true },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
      },
    ],
    lastMessage: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
)

const serializeMessagingChannel = (
  messagingChannel: Partial<MessagingChannel>
): Partial<MessagingChannel> =>
  pick(
    messagingChannel,
    'id',
    'chimeChatChannelArn',
    'participants',
    'unreadCount',
    'status',
    'lastMessage',
    'session'
  ) as Partial<MessagingChannel>

MessagingChannelSchema.methods.toJSON = function (
  this: MessagingChannel
): Partial<MessagingChannel> {
  return serializeMessagingChannel(this)
}

MessagingChannelSchema.plugin(mongoosePaginate)
MessagingChannelSchema.plugin(mongooseAutopopulate)

export const MessagingChannelModel = mongoose.model<
  MessagingChannel,
  PaginateModel<MessagingChannel>
>('MessagingChannel', MessagingChannelSchema)
