import mongoose, { Schema, Document, PaginateModel } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

import { pick } from 'utils/object/pick'
import { ModelRef } from 'interfaces/ModelRef'
import { getEnumValues } from 'utils/enum/enumUtils'
import { User } from 'models/User'
import {
  NotificationAudience,
  NotificationChannel,
  NotificationType,
  TemplateConfig,
} from 'models/NotificationConfig'

export enum NotificationStatus {
  Failed = 'failed',
  Sent = 'sent',
  Queued = 'queued',
  Read = 'read',
}

export interface Notification extends Document {
  notificationType: NotificationType
  audience: NotificationAudience
  status: NotificationStatus
  channel: NotificationChannel
  attempts: number
  payload: object
  targetUser: ModelRef<User>
  referencedUser?: ModelRef<User>
  templateConfig: TemplateConfig
  updatedAt: Date
  createdBy: ModelRef<User>
  createdAt: Date
  sendAfter?: Date
  immediate: boolean
}

const NotificationSchema = new Schema<Notification>(
  {
    notificationType: {
      type: String,
      enum: getEnumValues(NotificationType),
      required: true,
    },
    audience: {
      type: String,
      enum: getEnumValues(NotificationAudience),
      required: true,
    },
    status: {
      type: String,
      enum: getEnumValues(NotificationStatus),
      default: NotificationStatus.Queued,
      required: true,
    },
    channel: { type: String, enum: getEnumValues(NotificationChannel) },
    attempts: { type: Number, default: 0 },
    payload: { type: Object },
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    referencedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    templateConfig: {
      type: Object,
      immutable: true,
      required: true,
    },
    sendAfter: {
      type: Date,
      immutable: true,
    },
    immediate: {
      type: Boolean,
      immutable: true,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      immutable: true,
      required: true,
    },
  },
  { timestamps: true }
)

const serializeNotification = (notification: Notification): Notification =>
  pick(
    notification,
    'id',
    'notificationType',
    'audience',
    'status',
    'channel',
    'payload',
    'targetUser',
    'referencedUser',
    'sendAfter',
    'templateConfig',
    'createdBy'
  ) as Notification

NotificationSchema.methods.toJSON = function (
  this: Notification
): Partial<Notification> {
  return serializeNotification(this)
}

NotificationSchema.plugin(mongoosePaginate)

export const NotificationModel = mongoose.model<
  Notification,
  PaginateModel<Notification>
>('Notification', NotificationSchema)
