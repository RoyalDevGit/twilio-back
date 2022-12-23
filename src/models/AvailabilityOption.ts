import mongoose, { Schema, Document, Types } from 'mongoose'

import { pick } from 'utils/object/pick'
import { ModelRef } from 'interfaces/ModelRef'
import { getEnumValues } from 'utils/enum/enumUtils'
import { Expert } from 'models/Expert'
import { Weekday } from 'models/Event'

export interface AvailabilityTimeRange extends Types.Subdocument {
  startTime: string
  endTime: string
}

const AvailabilityTimeRangeSchema = new Schema<AvailabilityTimeRange>({
  startTime: { type: String, required: true, trim: true },
  endTime: { type: String, required: true, trim: true },
})

const serializeAvailabilityTimeRangeSchema = (
  range: AvailabilityTimeRange
): AvailabilityTimeRange =>
  pick(range, 'id', 'startTime', 'endTime') as AvailabilityTimeRange

AvailabilityTimeRangeSchema.methods.toJSON = function (
  this: AvailabilityTimeRange
): Partial<AvailabilityTimeRange> {
  return serializeAvailabilityTimeRangeSchema(this)
}

export interface AvailabilityOption extends Document {
  enabled: boolean
  expert: ModelRef<Expert>
  weekday: Weekday
  ranges: AvailabilityTimeRange[]
  updatedAt: Date
  createdAt: Date
}

const AvailabilityOptionSchema = new Schema<AvailabilityOption>(
  {
    enabled: { type: Boolean, default: true },
    expert: {
      type: Schema.Types.ObjectId,
      ref: 'Expert',
      required: true,
      immutable: true,
    },
    weekday: { type: Number, enum: getEnumValues(Weekday), immutable: true },
    ranges: [{ type: AvailabilityTimeRangeSchema }],
  },
  { timestamps: true }
)

const serializeAvailabilityOption = (
  availability: AvailabilityOption
): AvailabilityOption =>
  pick(
    availability,
    'id',
    'expert',
    'enabled',
    'weekday',
    'ranges',
    'createdAt',
    'updatedAt'
  ) as AvailabilityOption

AvailabilityOptionSchema.methods.toJSON = function (
  this: AvailabilityOption
): Partial<AvailabilityOption> {
  return serializeAvailabilityOption(this)
}

export const AvailabilityOptionModel = mongoose.model<AvailabilityOption>(
  'AvailabilityOption',
  AvailabilityOptionSchema
)
