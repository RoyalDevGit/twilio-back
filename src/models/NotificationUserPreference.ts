import mongoose, { Schema, Document } from 'mongoose'

import { pick } from 'utils/object/pick'
import { getEnumValues } from 'utils/enum/enumUtils'
import { ModelRef } from 'interfaces/ModelRef'
import { User } from 'models/User'
import {
  NotificationChannel,
  NotificationType,
} from 'models/NotificationConfig'

export interface NotificationUserPreference extends Document {
  notificationType: NotificationType
  userId: ModelRef<User>
  channels: NotificationChannel[]
}

const NotificationUserPreferenceSchema = new Schema<NotificationUserPreference>(
  {
    notificationType: {
      type: String,
      enum: getEnumValues(NotificationType),
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    channels: {
      type: [{ type: String }],
      enum: getEnumValues(NotificationChannel),
    },
  }
)

const serializeNotification = (
  notification: NotificationUserPreference
): NotificationUserPreference =>
  pick(
    notification,
    'notificationType',
    'channels'
  ) as NotificationUserPreference

NotificationUserPreferenceSchema.methods.toJSON = function (
  this: NotificationUserPreference
): Partial<NotificationUserPreference> {
  return serializeNotification(this)
}

export const NotificationUserPreferenceModel =
  mongoose.model<NotificationUserPreference>(
    'NotificationUserPreference',
    NotificationUserPreferenceSchema
  )
