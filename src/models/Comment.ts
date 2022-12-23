import mongoose, { Schema, Document, PaginateModel } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import mongooseAutopopulate from 'mongoose-autopopulate'

import { User } from 'models/User'
import { ModelRef, ObjectIdLike } from 'interfaces/ModelRef'
import { pick } from 'utils/object/pick'
import { getEnumValues } from 'utils/enum/enumUtils'
import { Env } from 'utils/env'
import { CommentLikeStatusValue } from 'models/CommentLikeStatus'

const MAX_COMMENT_CONTENT_LENGTH = Env.getNumber('MAX_COMMENT_CONTENT_LENGTH')

export enum CommentType {
  Comment = 'comment',
  Review = 'review',
}

export enum CommentEntityType {
  Video = 'video',
  Expert = 'expert',
  Consumer = 'consumer',
  Session = 'session',
  Comment = 'comment',
}

export interface AverageRating {
  rating: number
  count: number
}

export const AverageRatingSchema = new Schema<AverageRating>({
  rating: { type: Number, min: 1, max: 5 },
  count: { type: Number },
})

export interface AverageRatings
  extends Partial<Record<CommentEntityType, AverageRating>> {
  overall?: AverageRating
}

export const AverageRatingsSchema = new Schema<AverageRatings>({
  overall: { type: AverageRatingSchema },
  expert: { type: AverageRatingSchema },
  consumer: { type: AverageRatingSchema },
  session: { type: AverageRatingSchema },
  comment: { type: AverageRatingSchema },
  video: { type: AverageRatingSchema },
})

export interface Ratings extends Partial<Record<CommentEntityType, number>> {
  overall?: number
}

export const RatingsSchema = new Schema<Ratings>({
  overall: { type: Number, min: 1, max: 5 },
  expert: { type: Number, min: 1, max: 5 },
  consumer: { type: Number, min: 1, max: 5 },
  session: { type: Number, min: 1, max: 5 },
  comment: { type: Number, min: 1, max: 5 },
  video: { type: Number, min: 1, max: 5 },
})

export interface Comment extends Document {
  commentType: CommentType
  entityType: CommentEntityType
  entityId: ObjectIdLike
  subject?: string
  content?: string
  edited: boolean
  ratings?: Ratings
  likeCount: number
  dislikeCount: number
  totalReplies: number
  pinned: boolean
  likeStatus: CommentLikeStatusValue
  createdBy: ModelRef<User>
  updatedAt: Date
  createdAt: Date
}

const CommentSchema = new Schema<Comment, PaginateModel<Comment>>(
  {
    commentType: {
      type: String,
      trim: true,
      required: true,
      immutable: true,
      enum: getEnumValues(CommentType),
    },
    entityType: {
      type: String,
      trim: true,
      required: true,
      immutable: true,
      enum: getEnumValues(CommentEntityType),
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      immutable: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: MAX_COMMENT_CONTENT_LENGTH,
    },
    ratings: { type: RatingsSchema },
    likeCount: { type: Number, default: 0, min: 0 },
    dislikeCount: { type: Number, default: 0, min: 0 },
    totalReplies: { type: Number, default: 0, min: 0 },
    pinned: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
      autopopulate: true,
    },
  },
  { timestamps: true }
)

const serializeComment = (comment: Partial<Comment>): Partial<Comment> =>
  pick(
    comment,
    'id',
    'commentType',
    'entityType',
    'entityId',
    'subject',
    'content',
    'ratings',
    'likeCount',
    'dislikeCount',
    'totalReplies',
    'pinned',
    'likeStatus',
    'createdBy',
    'createdAt',
    'updatedAt'
  ) as Partial<Comment>

CommentSchema.methods.toJSON = function (this: Comment): Partial<Comment> {
  return serializeComment(this)
}

CommentSchema.plugin(mongoosePaginate)
CommentSchema.plugin(mongooseAutopopulate)

export const CommentModel = mongoose.model<Comment, PaginateModel<Comment>>(
  'Comment',
  CommentSchema
)
