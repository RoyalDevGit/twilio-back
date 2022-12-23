import { OpenAPIV3_1 } from 'openapi-types'

import { CommentEntityType, CommentType } from 'models/Comment'
import { SessionStatus } from 'models/Session'
import { PaymentMethodStatus, PaymentMethodType } from 'models/PaymentMethod'
import { OrderStatus } from 'models/Order'
import { NotificationStatus } from 'models/Notification'
import { MessagingChannelStatus } from 'models/MessagingChannel'

export const allParameters: Record<string, OpenAPIV3_1.ParameterObject> = {
  ExpertId: {
    name: 'expertId',
    in: 'path',
    description: 'UUID of the expert',
    required: true,
    example: '621fbdb422d5b985544406a1',
    schema: {
      type: 'string',
    },
  },
  AvailabilityOptionId: {
    name: 'availabilityId',
    in: 'path',
    description: 'UUID of the expert availability',
    required: true,
    example: '621fbdb422d5b985544406a1',
    schema: {
      type: 'string',
    },
  },
  SessionDurationOptionId: {
    name: 'sessionDurationId',
    in: 'path',
    description: 'UUID of the expert session duration',
    required: true,
    example: '621fbdb422d5b985544406a1',
    schema: {
      type: 'string',
    },
  },
  BlockoutDateId: {
    name: 'blockoutDateId',
    in: 'path',
    description: 'UUID of the expert blockout date',
    required: true,
    example: '621fbdb422d5b985544406a1',
    schema: {
      type: 'string',
    },
  },
  AvailabilityDate: {
    name: 'selectedDate',
    in: 'query',
    description: 'Date to be used to find time slots',
    example: '2012-02-16T23:59:59.999Z',
    schema: {
      type: 'string',
      format: 'date-time',
    },
  },
  AvailabilityDuration: {
    name: 'selectedDuration',
    in: 'query',
    description: 'Duration in minutes to be used to find time slots',
    example: 15,
    schema: {
      type: 'integer',
    },
  },
  CategoryId: {
    name: 'categoryId',
    in: 'path',
    required: true,
    example: '620b1e5c54dcdbb1cc995619',
    schema: {
      type: 'string',
    },
  },
  LanguageId: {
    name: 'languageId',
    in: 'path',
    required: true,
    example: '620b1e5c54dcdbb1cc995619',
    schema: {
      type: 'string',
    },
  },
  EventId: {
    name: 'eventId',
    in: 'path',
    required: true,
    example: '620bdbb1cc995611e5c54dc9',
    schema: {
      type: 'string',
    },
  },
  EventReservationId: {
    name: 'reservationId',
    in: 'path',
    required: true,
    example: '620bc418af92325a23ed5769',
    schema: {
      type: 'string',
    },
  },
  FromDate: {
    name: 'from',
    in: 'query',
    description: 'Start date of query',
    required: true,
    example: '2012-02-16T00:00:00Z',
    schema: {
      type: 'string',
      format: 'date-time',
    },
  },
  ToDate: {
    name: 'to',
    in: 'query',
    description: 'End date of query',
    required: true,
    example: '2012-02-16T23:59:59.999Z',
    schema: {
      type: 'string',
      format: 'date-time',
    },
  },
  CommentId: {
    name: 'commentId',
    in: 'path',
    description: 'UUID of the comment',
    required: true,
    example: '623153039307675ef27b2920',
    schema: {
      type: 'string',
    },
  },
  CommentEntityType: {
    name: 'entityType',
    in: 'query',
    description: 'Type of entity linked to comment',
    required: true,
    example: CommentEntityType.Expert,
    schema: {
      type: 'string',
    },
  },
  CommentType: {
    name: 'entityType',
    in: 'query',
    description: 'Type of comment',
    required: true,
    example: CommentType.Review,
    schema: {
      type: 'string',
    },
  },
  CommentEntityId: {
    name: 'entityId',
    in: 'query',
    description: 'ID of entity linked to comment',
    required: true,
    example: '623153039307675ef27b2920',
    schema: {
      type: 'string',
    },
  },
  CreatedBy: {
    name: 'createdBy',
    in: 'query',
    description: 'ID of the user that created the comment',
    example: '623153039307675ef27b2920',
    schema: {
      type: 'string',
    },
  },
  Page: {
    name: 'page',
    schema: {
      type: 'integer',
    },
    in: 'query',
    description: 'Number of page to retrieve',
    example: 1,
  },
  Limit: {
    name: 'limit',
    schema: {
      type: 'integer',
    },
    in: 'query',
    description:
      'Number of records to retrieve in a single page if pagination is enabled',
    example: 10,
  },
  Sort: {
    name: 'sort',
    in: 'query',
    description: 'Property path used for sorting',
    schema: {
      type: 'string',
    },
  },
  SortDirection: {
    name: 'sortDirection',
    in: 'query',
    description: 'Direction for the sort',
    schema: {
      type: 'string',
      enum: ['asc', 'desc'],
    },
  },
  Favorites: {
    name: 'favorites',
    schema: {
      type: 'boolean',
    },
    in: 'query',
    description: 'Whether only user favorites should return',
    example: false,
  },
  SessionId: {
    name: 'sessionId',
    in: 'path',
    description: 'UUID of session',
    required: true,
    example: '621fbd7b22d5b98554440694',
    schema: {
      type: 'string',
    },
  },
  SessionStatus: {
    name: 'status',
    in: 'query',
    description: 'Status of session',
    schema: {
      type: 'array',
      items: {
        allOf: [{ $ref: '#/components/schemas/SessionStatus' }],
        example: [SessionStatus.Active, SessionStatus.NotStarted],
      },
    },
    style: 'form',
    explode: true,
  },
  ChimeAttendeeId: {
    name: 'chimeAttendeeId',
    in: 'path',
    description: 'Chime attendee ID',
    required: true,
    example: 'e9a75ffd-ac0d-fcb8-f787-4e6d59a1c925',
    schema: {
      type: 'string',
    },
  },
  UserId: {
    name: 'userId',
    in: 'path',
    description: 'UUID of user',
    required: true,
    example: '621fbd7b22d5b98554440694',
    schema: {
      type: 'string',
    },
  },
  VideoId: {
    name: 'videoId',
    in: 'path',
    description: 'UUID of the parent video',
    required: true,
    example: '6209a5de48669871d2a0cd4b',
    schema: {
      type: 'string',
    },
  },
  PaymentMethodId: {
    name: 'paymentMethodId',
    in: 'path',
    description: 'UUID of the payment method',
    required: true,
    example: '6209a5de48669871d2a0cd4b',
    schema: {
      type: 'string',
    },
  },
  PaymentMethodStatus: {
    name: 'status',
    in: 'query',
    description: 'Status of a payment method',
    example: PaymentMethodStatus.Ready,
    schema: {
      type: 'array',
      items: {
        allOf: [{ $ref: '#/components/schemas/PaymentMethodStatus' }],
      },
    },
    style: 'form',
    explode: true,
  },
  PaymentMethodType: {
    name: 'type',
    in: 'query',
    description: 'Type of a payment method',
    example: PaymentMethodType.CreditCard,
    schema: {
      type: 'array',
      items: {
        allOf: [{ $ref: '#/components/schemas/PaymentMethodType' }],
      },
    },
    style: 'form',
    explode: true,
  },
  OrderId: {
    name: 'orderId',
    in: 'path',
    description: 'UUID of the order',
    required: true,
    example: '6209a5de48669871d2a0cd4b',
    schema: {
      type: 'string',
    },
  },
  OrderStatus: {
    name: 'status',
    in: 'query',
    description: 'Status of an order',
    example: OrderStatus.Complete,
    schema: {
      type: 'array',
      items: {
        allOf: [{ $ref: '#/components/schemas/OrderStatus' }],
      },
    },
    style: 'form',
    explode: true,
  },
  SearchQuery: {
    name: 'query',
    in: 'query',
    description: 'Search word or phrase',
    required: true,
    example: 'Plumber in Florida',
    schema: {
      type: 'string',
    },
  },
  NotificationId: {
    name: 'notificationType',
    in: 'path',
    description: 'UUID of the Notification',
    required: true,
    example: '6209a5de48669871d2a0cd4b',
    schema: {
      type: 'string',
    },
  },
  NotificationStatus: {
    name: 'status',
    in: 'query',
    description: 'Status of notification',
    schema: {
      type: 'array',
      items: {
        allOf: [{ $ref: '#/components/schemas/NotificationStatus' }],
        example: [
          NotificationStatus.Queued,
          NotificationStatus.Sent,
          NotificationStatus.Read,
        ],
      },
    },
    style: 'form',
    explode: true,
  },
  CategoryOnly: {
    name: 'only',
    in: 'query',
    description:
      'Specify whether you want parent categories or subcategories only',
    schema: {
      type: 'string',
      enum: ['parents', 'subcategories'],
    },
  },
  TimeZoneName: {
    name: 'timeZoneName',
    in: 'path',
    description: 'Name of timezone',
    required: true,
    example: 'America/Los_Angeles',
    schema: {
      type: 'string',
    },
  },
  GlobalSearchIndex: {
    name: 'index',
    in: 'query',
    description: 'Index to search',
    schema: {
      type: 'array',
      items: {
        type: 'string',
      },
      example: ['experts', 'subcategories'],
    },
    style: 'form',
    explode: true,
  },
  MessagingChannelId: {
    name: 'channelId',
    in: 'path',
    description: 'UUID of the channel',
    required: true,
    example: '6209a5de48669871d2a0cd4b',
    schema: {
      type: 'string',
    },
  },
  MessagingChannelStatus: {
    name: 'status',
    in: 'query',
    description: 'Status of messaging channel',
    schema: {
      type: 'array',
      items: {
        allOf: [{ $ref: '#/components/schemas/MessagingChannelStatus' }],
        example: [
          MessagingChannelStatus.Open,
          MessagingChannelStatus.Minimized,
        ],
      },
    },
    style: 'form',
    explode: true,
  },
  ChimeChatChannelArn: {
    name: 'chimeChatChannelArn',
    in: 'path',
    description: 'ARN of chime chat channel',
    required: true,
    example: 'arn:abc123',
    schema: {
      type: 'string',
    },
  },
  ChimeMessageId: {
    name: 'chimeMessageId',
    in: 'path',
    description: 'ID of chime message',
    required: true,
    example: '6209a5de48669871d2a0cd4b',
    schema: {
      type: 'string',
    },
  },
  MessagingPaginationNextToken: {
    name: 'nextToken',
    in: 'query',
    description: 'Next token to continue paginating through messages',
    example: 'as8dyuaapisdaysh0asan23lk23k',
    schema: {
      type: 'string',
    },
  },
  MessagingChannelOnlyStarted: {
    name: 'onlyStarted',
    schema: {
      type: 'boolean',
    },
    in: 'query',
    description:
      'Whether only channels with at least one message should return',
    example: false,
  },
  IgnoreActiveSession: {
    name: 'ignoreActiveSession',
    schema: {
      type: 'boolean',
    },
    in: 'query',
    description:
      'Whether active sessions should be used to calculate the instant session availability. Useful for getting availability of an expert when attempting to extend a session',
    example: false,
  },
  VerifiedFilter: {
    name: 'verified',
    schema: {
      type: 'boolean',
    },
    in: 'query',
    description:
      'Whether only verified experts should be included in the results',
    example: false,
  },
  OnlineNowFilter: {
    name: 'onlineNow',
    schema: {
      type: 'boolean',
    },
    in: 'query',
    description:
      'Whether only experts that are currently available should be included in the results',
    example: false,
  },
  CategoryFilter: {
    name: 'category',
    in: 'query',
    description:
      'The parent category codes that will be used to filter the result set',
    schema: {
      type: 'array',
      items: {
        type: 'string',
        example: ['business', 'education', 'science'],
      },
    },
    style: 'form',
    explode: true,
  },
  LanguageFilter: {
    name: 'language',
    in: 'query',
    description:
      'The language codes that will be used to filter the result set',
    schema: {
      type: 'array',
      items: {
        type: 'string',
        example: ['eng', 'spa'],
      },
    },
    style: 'form',
    explode: true,
  },
  ExpertRateFilter: {
    name: 'rate',
    in: 'query',
    description:
      'The expert hourly rate range that will be used to filter the result set',
    schema: {
      type: 'array',
      items: {
        type: 'string',
        example: ['50-100', '300'],
      },
    },
    style: 'form',
    explode: true,
  },
  ExpertRatingFilter: {
    name: 'rating',
    in: 'query',
    description:
      'The expert rating range that will be used to filter the result set',
    schema: {
      type: 'array',
      items: {
        type: 'string',
        example: ['3-5', '5'],
      },
    },
    style: 'form',
    explode: true,
  },
}
