import mongoose, { Schema, Document } from 'mongoose'

import { pick } from 'utils/object/pick'
import { ModelRef } from 'interfaces/ModelRef'
import { Expert } from 'models/Expert'
import { Price, PriceSchema } from 'models/Price'

export interface SessionDurationOption extends Document {
  expert: ModelRef<Expert>
  duration: number
  price: Price
  updatedAt: Date
  createdAt: Date
}

const SessionDurationOptionSchema = new Schema<SessionDurationOption>(
  {
    expert: {
      type: Schema.Types.ObjectId,
      ref: 'Expert',
      required: true,
      immutable: true,
    },
    duration: { type: Number, required: true },
    price: { type: PriceSchema },
  },
  { timestamps: true }
)

const serializeSessionDurationOption = (
  duration: SessionDurationOption
): SessionDurationOption =>
  pick(
    duration,
    'id',
    'expert',
    'duration',
    'price',
    'createdAt',
    'updatedAt'
  ) as SessionDurationOption

SessionDurationOptionSchema.methods.toJSON = function (
  this: SessionDurationOption
): Partial<SessionDurationOption> {
  return serializeSessionDurationOption(this)
}

export const SessionDurationOptionModel = mongoose.model<SessionDurationOption>(
  'SessionDurationOption',
  SessionDurationOptionSchema
)
