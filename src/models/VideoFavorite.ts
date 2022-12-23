import mongoose, { Schema, Document } from 'mongoose'

import { User } from 'models/User'
import { Video } from 'models/Video'
import { ModelRef } from 'interfaces/ModelRef'
import { pick } from 'utils/object/pick'

export interface VideoFavorite extends Document {
  user: ModelRef<User>
  video: ModelRef<Video>
  updatedAt: Date
  createdAt: Date
  createdBy: ModelRef<User>
}

const VideoFavoriteSchema = new Schema<VideoFavorite>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: true,
      immutable: true,
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

const serializeVideoFavorite = (
  likeStatus: Partial<VideoFavorite>
): Partial<VideoFavorite> =>
  pick(
    likeStatus,
    'id',
    'user',
    'video',
    'createdAt',
    'updatedAt',
    'createdBy'
  ) as Partial<VideoFavorite>

VideoFavoriteSchema.methods.toJSON = function (
  this: VideoFavorite
): Partial<VideoFavorite> {
  return serializeVideoFavorite(this)
}

export const VideoFavoriteModel = mongoose.model(
  'VideoFavorite',
  VideoFavoriteSchema
)
