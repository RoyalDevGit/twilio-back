import { OpenAPIV3_1 } from 'openapi-types'

import {
  NotificationChannel,
  NotificationContentFormat,
  NotificationType,
} from 'models/NotificationConfig'
import { getEnumValues } from 'utils/enum/enumUtils'
import { NotificationStatus } from 'models/Notification'

export const NotificationStatusSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  NotificationStatus: {
    type: 'string',
    description: 'Notification status',
    enum: getEnumValues(NotificationStatus),
    example: NotificationStatus.Queued,
  },
}

export const NotificationResponseSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  NotificationResponse: {
    type: 'object',
    description: 'List of templates',
    properties: {
      templates: {
        description: 'Array of items returned by the query',
        type: 'array',
        items: {
          type: 'object',
        },
        example: [
          {
            id: NotificationType.SimpleMessage,
            allowOptOut: true,
            availableChannels: [
              NotificationChannel.Email,
              NotificationChannel.SMS,
            ],
            userChannels: [NotificationChannel.Email, NotificationChannel.SMS],
          },
        ],
      },
    },
  },
  NotificationPreferenceResponse: {
    type: 'object',
    properties: {
      notificationType: {
        type: 'string',
        enum: getEnumValues(NotificationType),
      },
      userChannels: {
        description: 'Array containing all preferred channels',
        type: 'array',
        items: {
          type: 'string',
        },
        enum: getEnumValues(NotificationChannel),
        default: [NotificationChannel.Email],
        example: [NotificationChannel.Email, NotificationChannel.SMS],
      },
    },
  },
  NotificationItemResponse: {
    type: 'object',
    description: 'A single notification',
    properties: {
      id: {
        type: 'string',
        example: '620656c02c5e77db620a67d7',
      },
      status: {
        enum: getEnumValues(NotificationStatus),
        example: NotificationStatus.Sent,
      },
      createdAt: {
        type: 'string',
        format: 'date',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      message: {
        type: 'string',
        example: 'Hello World',
      },
      contentFormat: {
        type: 'string',
        enum: getEnumValues(NotificationContentFormat),
        default: NotificationContentFormat.PlainText,
      },
      referencedUser: {
        allOf: [{ $ref: '#/components/schemas/Consumer' }],
      },
    },
  },
  NotificationQueueResponse: {
    type: 'object',
    description: 'List of Notifications',
    properties: {
      notifications: {
        description: 'Array of notifications',
        type: 'array',
        items: {
          type: 'object',
        },
        example: [
          {
            id: '620656c02c5e77db620a67d7',
            status: NotificationStatus.Sent,
            createdAt: {
              type: 'string',
              format: 'date',
              example: '2022-02-16T00:00:00Z',
              readOnly: true,
            },
            message: 'Hello World',
            contentFormat: {
              type: 'string',
              enum: getEnumValues(NotificationContentFormat),
              default: NotificationContentFormat.PlainText,
            },
            referencedUser: {
              allOf: [{ $ref: '#/components/schemas/Consumer' }],
            },
          },
        ],
      },
    },
  },
}

export const MarkNotificationAsReadPayloadSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  MarkNotificationAsReadPayload: {
    type: 'object',
    required: [
      'phoneNumber',
      'description',
      'mainAreaOfExpertise',
      'location',
      'expertiseTags',
      'languages',
      'bannerImage',
      'expertSince',
      'status',
    ],
    properties: {
      notificationIds: {
        description: 'IDs of notifications to mark as read',
        type: 'array',
        items: {
          type: 'string',
        },
        example: ['620656c02c5e77db620a67d7', '720656c02c5e77db620a67d7'],
      },
    },
  },
}
