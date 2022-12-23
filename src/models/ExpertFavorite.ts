import mongoose, { Schema, Document } from 'mongoose'

import { User } from 'models/User'
import { Expert } from 'models/Expert'
import { ModelRef } from 'interfaces/ModelRef'
import { pick } from 'utils/object/pick'

export interface ExpertFavorite extends Document {
  user: ModelRef<User>
  expert: ModelRef<Expert>
  updatedAt: Date
  createdAt: Date
  createdBy: ModelRef<User>
}

const ExpertFavoriteSchema = new Schema<ExpertFavorite>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expert: {
      type: Schema.Types.ObjectId,
      ref: 'Expert',
      required: true,
      immutable: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

const serializeExpertFavorite = (
  likeStatus: Partial<ExpertFavorite>
): Partial<ExpertFavorite> =>
  pick(
    likeStatus,
    'id',
    'user',
    'expert',
    'createdAt',
    'updatedAt',
    'createdBy'
  ) as Partial<ExpertFavorite>

ExpertFavoriteSchema.methods.toJSON = function (
  this: ExpertFavorite
): Partial<ExpertFavorite> {
  return serializeExpertFavorite(this)
}

export const ExpertFavoriteModel = mongoose.model(
  'ExpertFavorite',
  ExpertFavoriteSchema
)
