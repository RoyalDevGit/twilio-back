import mongoose, { Schema, Document } from 'mongoose'

import { User } from 'models/User'
import { Comment } from 'models/Comment'
import { ModelRef } from 'interfaces/ModelRef'
import { pick } from 'utils/object/pick'
import { getEnumValues } from 'utils/enum/enumUtils'

export enum CommentLikeStatusValue {
  Liked = 'liked',
  Disliked = 'disliked',
}
export interface CommentLikeStatus extends Document {
  user: ModelRef<User>
  comment: ModelRef<Comment>
  value: CommentLikeStatusValue
  updatedAt: Date
  createdAt: Date
  createdBy: ModelRef<User>
}

const CommentLikeStatusSchema = new Schema<CommentLikeStatus>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      required: true,
      immutable: true,
    },
    value: {
      type: String,
      trim: true,
      required: true,
      enum: getEnumValues(CommentLikeStatusValue),
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
  },
  { timestamps: true }
)

const serializeCommentLikeStatus = (
  likeStatus: Partial<CommentLikeStatus>
): Partial<CommentLikeStatus> =>
  pick(
    likeStatus,
    'id',
    'user',
    'comment',
    'value',
    'createdAt',
    'updatedAt',
    'createdBy'
  ) as Partial<CommentLikeStatus>

CommentLikeStatusSchema.methods.toJSON = function (
  this: CommentLikeStatus
): Partial<CommentLikeStatus> {
  return serializeCommentLikeStatus(this)
}

export const CommentLikeStatusModel = mongoose.model(
  'CommentLikeStatus',
  CommentLikeStatusSchema
)
