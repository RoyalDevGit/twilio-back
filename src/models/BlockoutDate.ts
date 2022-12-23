import mongoose, { Schema, Document } from 'mongoose'

import { pick } from 'utils/object/pick'
import { ModelRef } from 'interfaces/ModelRef'
import { Expert } from 'models/Expert'

export interface BlockoutDate extends Document {
  expert: ModelRef<Expert>
  date: Date
  updatedAt: Date
  createdAt: Date
}

const BlockoutDateSchema = new Schema<BlockoutDate>(
  {
    expert: {
      type: Schema.Types.ObjectId,
      ref: 'Expert',
      required: true,
      immutable: true,
    },
    date: { type: Date, required: true },
  },
  { timestamps: true }
)

const serializeBlockoutDate = (blockoutDate: BlockoutDate): BlockoutDate =>
  pick(
    blockoutDate,
    'id',
    'expert',
    'date',
    'createdAt',
    'updatedAt'
  ) as BlockoutDate

BlockoutDateSchema.methods.toJSON = function (
  this: BlockoutDate
): Partial<BlockoutDate> {
  return serializeBlockoutDate(this)
}

export const BlockoutDateModel = mongoose.model<BlockoutDate>(
  'BlockoutDate',
  BlockoutDateSchema
)
