import mongoose, { Schema, Document } from 'mongoose'

import { User } from 'models/User'
import { Event } from 'models/Event'
import { ModelRef } from 'interfaces/ModelRef'
import { pick } from 'utils/object/pick'

export interface EventReservation extends Document {
  user: ModelRef<User>
  event: ModelRef<Event>
  updatedAt: Date
  createdAt: Date
  createdBy: ModelRef<User>
}

const EventReservationSchema = new Schema<EventReservation>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
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

const serializeEventReservation = (
  reservation: Partial<EventReservation>
): Partial<EventReservation> =>
  pick(
    reservation,
    'id',
    'user',
    'event',
    'createdAt',
    'updatedAt',
    'createdBy'
  ) as Partial<EventReservation>

EventReservationSchema.methods.toJSON = function (
  this: EventReservation
): Partial<EventReservation> {
  return serializeEventReservation(this)
}

export const EventReservationModel = mongoose.model(
  'EventReservation',
  EventReservationSchema
)
