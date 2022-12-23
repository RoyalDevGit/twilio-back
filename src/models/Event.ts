import mongoose, { Schema, Document, Types } from 'mongoose'
import { DateTime } from 'luxon'

import { User } from 'models/User'
import { ModelRef } from 'interfaces/ModelRef'
import { getEnumValues } from 'utils/enum/enumUtils'
import { EventReservation } from 'models/EventReservation'
import { pick } from 'utils/object/pick'
import { Expert } from 'models/Expert'

export enum EventFrequency {
  Yearly = 'yearly',
  Monthly = 'monthly',
  Weekly = 'weekly',
  Daily = 'daily',
  Hourly = 'hourly',
  Minutely = 'minutely',
  Secondly = 'secondly',
}

export enum Weekday {
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
  Sunday = 7,
}

export enum Month {
  January = 1,
  February = 2,
  March = 3,
  April = 4,
  May = 5,
  June = 6,
  July = 7,
  August = 8,
  September = 9,
  October = 10,
  November = 11,
  December = 12,
}

export interface EventRecursion extends Types.Subdocument {
  frequency: EventFrequency
  interval: number
  maxOccurrences?: number
  endDate?: Date
  weekdays?: Weekday[]
  position?: number[]
  monthDay?: number[]
}

const EventRecursionSchema = new Schema<EventRecursion>({
  frequency: {
    type: String,
    required: true,
    trim: true,
    enum: getEnumValues(EventFrequency),
  },
  interval: { type: Number, required: true },
  maxOccurrences: { type: Number },
  endDate: { type: Date },
  weekdays: {
    type: [{ type: Number, enum: getEnumValues(Weekday) }],
    default: undefined,
  },
  position: {
    type: [{ type: Number }],
    default: undefined,
  },
  monthDay: {
    type: [{ type: Number, enum: getEnumValues(Month) }],
    default: undefined,
  },
})

const serializeEventRecursion = (
  event: Partial<EventRecursion>
): Partial<EventRecursion> =>
  pick(
    event,
    'frequency',
    'interval',
    'maxOccurrences',
    'endDate',
    'weekdays',
    'position',
    'monthDay'
  ) as Partial<EventRecursion>

EventRecursionSchema.methods.toJSON = function (
  this: EventRecursion
): Partial<EventRecursion> {
  return serializeEventRecursion(this)
}

export interface EventDate {
  timeZone: string
  date: Date
}

export const EventDateSchema = new Schema<EventDate>({
  timeZone: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
})

const serializeEventDate = (
  eventDate: Partial<EventDate>
): Partial<EventDate> =>
  pick(eventDate, 'timeZone', 'date') as Partial<EventDate>

EventDateSchema.methods.toJSON = function (
  this: EventDate
): Partial<EventDate> {
  return serializeEventDate(this)
}

export interface Event<T = void> extends Document {
  instanceId: string
  title: string
  description?: string
  originalStartDate: EventDate
  startDate: EventDate
  endDate: EventDate
  allDay: boolean
  recursion?: EventRecursion
  eventData?: T
  currentUserReservation?: ModelRef<EventReservation>
  expert?: ModelRef<Expert>
  parentEvent?: ModelRef<Event<T>>
  createdBy: ModelRef<User>
}

const EventSchema = new Schema<Event>(
  {
    instanceId: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    originalStartDate: { type: EventDateSchema, immutable: true },
    startDate: EventDateSchema,
    endDate: EventDateSchema,
    allDay: { type: Boolean, required: true },
    recursion: EventRecursionSchema,
    eventData: { type: Map },
    expert: { type: Schema.Types.ObjectId, ref: 'Expert', required: true },
    parentEvent: { type: Schema.Types.ObjectId, ref: 'Event' },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
  },
  { timestamps: true }
)

const serializeEvent = (event: Partial<Event>): Partial<Event> =>
  pick(
    event,
    'instanceId',
    'id',
    'title',
    'description',
    'startDate',
    'endDate',
    'allDay',
    'recursion',
    'eventData',
    'currentUserReservation',
    'expert',
    'parentEvent',
    'createdBy'
  ) as Partial<Event>

EventSchema.methods.toJSON = function (this: Event): Partial<Event> {
  return serializeEvent(this)
}

EventSchema.pre('save', function (this: Event) {
  if (this.allDay) {
    this.startDate.date = DateTime.fromJSDate(this.startDate.date)
      .startOf('day')
      .toJSDate()
    this.endDate.date = DateTime.fromJSDate(this.startDate.date)
      .endOf('day')
      .toJSDate()
  }
})

export const EventModel = mongoose.model('Event', EventSchema)
