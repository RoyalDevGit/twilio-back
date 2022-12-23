import mongoose, { Schema, Document, PaginateModel } from 'mongoose'
import mongooseAutopopulate from 'mongoose-autopopulate'
import mongoosePaginate from 'mongoose-paginate-v2'
import { ChimeSDKMeetings } from 'aws-sdk'

import { pick } from 'utils/object/pick'
import { getEnumValues } from 'utils/enum/enumUtils'
import { User } from 'models/User'
import { ModelRef } from 'interfaces/ModelRef'
import { Video } from 'models/Video'
import { Expert } from 'models/Expert'
import { Order } from 'models/Order'
import { EventDate, EventDateSchema } from 'models/Event'
import { MessagingChannel } from 'models/MessagingChannel'

export enum SessionStatus {
  NotStarted = 'not_started',
  Active = 'active',
  Ended = 'ended',
  Cancelled = 'cancelled',
}

export enum SessionAttendanceResult {
  NoneShowed = 'none_showed',
  NoShowExpert = 'no_show_expert',
  NoShowConsumer = 'no_show_consumer',
  AllPresent = 'all_present',
}

export interface Session extends Document {
  status: SessionStatus
  currentChimeMeeting?: ChimeSDKMeetings.Meeting
  chimeMeetings: ChimeSDKMeetings.Meeting[]
  chimeMediaCapturePipelines: AWS.Chime.MediaCapturePipeline[]
  currentMediaCapturePipeline?: AWS.Chime.MediaCapturePipeline
  order: Order
  consumer: ModelRef<User>
  expert: ModelRef<Expert>
  startDate: EventDate
  endDate: EventDate
  duration: number
  started?: Date
  ended?: Date
  totalMilliseconds?: number
  updatedAt: Date
  createdAt: Date
  createdBy: ModelRef<User>
  recordings: ModelRef<Video>[]
  instant: boolean
  notes?: string
  cancelledAt?: Date
  cancelledBy?: ModelRef<User>
  cancellationReason?: string
  messagingChannel: ModelRef<MessagingChannel>
  attendanceResult?: SessionAttendanceResult
  upcomingSessionReminderSent: boolean
}

const SessionSchema = new Schema<Session, PaginateModel<Session>>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    consumer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expert: { type: Schema.Types.ObjectId, ref: 'Expert', required: true },
    startDate: { type: EventDateSchema, required: true },
    endDate: { type: EventDateSchema, required: true },
    duration: { type: Number, required: true },
    status: {
      type: String,
      trim: true,
      enum: getEnumValues(SessionStatus),
      default: SessionStatus.NotStarted,
    },
    currentChimeMeeting: {
      type: Schema.Types.Mixed,
    },
    chimeMeetings: [{ type: Schema.Types.Mixed }],
    currentMediaCapturePipeline: {
      type: Schema.Types.Mixed,
    },
    chimeMediaCapturePipelines: [{ type: Schema.Types.Mixed }],
    started: { type: Date },
    ended: { type: Date },
    totalMilliseconds: { type: Number },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recordings: [{ type: Schema.Types.ObjectId, ref: 'Video' }],
    instant: { type: Boolean, default: false },
    notes: { type: String, trim: true },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancellationReason: { type: String, trim: true },
    messagingChannel: {
      type: Schema.Types.ObjectId,
      ref: 'MessagingChannel',
      autopopulate: true,
    },
    attendanceResult: {
      type: String,
      trim: true,
      enum: getEnumValues(SessionAttendanceResult),
    },
    upcomingSessionReminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
)

const serializeSession = (session: Session): Session =>
  pick(
    session,
    'id',
    'status',
    'currentChimeMeeting',
    'chimeMeetings',
    'currentMediaCapturePipeline',
    'chimeMediaCapturePipelines',
    'started',
    'ended',
    'totalMilliseconds',
    'createdAt',
    'updatedAt',
    'createdBy',
    'recordings',
    'consumer',
    'expert',
    'startDate',
    'endDate',
    'duration',
    'order',
    'instant',
    'notes',
    'cancelledAt',
    'cancelledBy',
    'cancellationReason',
    'messagingChannel',
    'attendanceResult'
  ) as Session

SessionSchema.methods.toJSON = function (this: Session): Partial<Session> {
  return serializeSession(this)
}

SessionSchema.plugin(mongooseAutopopulate)
SessionSchema.plugin(mongoosePaginate)

export const SessionModel = mongoose.model<Session, PaginateModel<Session>>(
  'Session',
  SessionSchema
)

export interface SessionAttendee extends Document {
  session: Session
  user: User
  chimeAttendee?: ChimeSDKMeetings.Attendee
}

const SessionAttendeeSchema = new Schema<SessionAttendee>(
  {
    session: { type: Schema.Types.ObjectId, ref: 'Session' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    chimeAttendee: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
)

const serializeSessionAttendee = (attendee: SessionAttendee): SessionAttendee =>
  pick(attendee, 'id', 'user', 'chimeAttendee') as SessionAttendee

SessionAttendeeSchema.methods.toJSON = function (
  this: SessionAttendee
): Partial<SessionAttendee> {
  return serializeSessionAttendee(this)
}

SessionAttendeeSchema.plugin(mongooseAutopopulate)

export const SessionAttendeeModel = mongoose.model(
  'SessionAttendee',
  SessionAttendeeSchema
)
