import mongoose, { Schema, Document, PaginateModel } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import mongooseAutopopulate from 'mongoose-autopopulate'

import { ModelRef } from 'interfaces/ModelRef'
import { pick } from 'utils/object/pick'
import { User } from 'models/User'
import { FileTracker } from 'models/FileTracker'
import { MessagingChannel } from 'models/MessagingChannel'

export interface ChannelMessageMetadata extends Document {
  channel: ModelRef<MessagingChannel>
  chimeMessageId?: string
  attachments: ModelRef<FileTracker>[]
  sender: ModelRef<User>
}

const ChannelMessageMetadataSchema = new Schema<
  ChannelMessageMetadata,
  PaginateModel<ChannelMessageMetadata>
>(
  {
    channel: {
      type: Schema.Types.ObjectId,
      ref: 'MessagingChannel',
      required: true,
    },
    chimeMessageId: { type: String, required: true },
    attachments: [
      { type: Schema.Types.ObjectId, ref: 'FileTracker', required: true },
    ],
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

const serializeChannelMessage = (
  metadata: Partial<ChannelMessageMetadata>
): Partial<ChannelMessageMetadata> =>
  pick(
    metadata,
    'id',
    'channel',
    'chimeMessageId',
    'attachments',
    'sender'
  ) as Partial<ChannelMessageMetadata>

ChannelMessageMetadataSchema.methods.toJSON = function (
  this: ChannelMessageMetadata
): Partial<ChannelMessageMetadata> {
  return serializeChannelMessage(this)
}

ChannelMessageMetadataSchema.plugin(mongoosePaginate)
ChannelMessageMetadataSchema.plugin(mongooseAutopopulate)

export const ChannelMessageMetadataModel = mongoose.model<
  ChannelMessageMetadata,
  PaginateModel<ChannelMessageMetadata>
>('ChannelMessageMetadata', ChannelMessageMetadataSchema)
