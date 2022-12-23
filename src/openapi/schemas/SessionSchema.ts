import { OpenAPIV3_1 } from 'openapi-types'

import { getEnumValues } from 'utils/enum/enumUtils'
import { SessionStatus } from 'models/Session'
import { SessionExtensionRequestStatus } from 'models/SessionExtensionRequest'

export const SessionStatusSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  SessionStatus: {
    type: 'string',
    description: 'Possible roles a user can have',
    enum: getEnumValues(SessionStatus),
    example: SessionStatus.NotStarted,
  },
}

export const SessionSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  Session: {
    type: 'object',
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620656c02c5e77db620a67d7',
      },
      status: {
        description: 'Status of the session',
        allOf: [{ $ref: '#/components/schemas/SessionStatus' }],
        default: SessionStatus.NotStarted,
        example: SessionStatus.NotStarted,
      },
      currentChimeMeeting: {
        description:
          'Current Chime Meeting object returned by AWS (see https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_CreateMeeting.html)',
        type: 'object',
        example: '620656c02c5e77db620a67d7',
      },
      chimeMeetings: {
        description:
          'List of all the Chime Meetings that were started in the session. (see object returned by AWS (see https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_CreateMeeting.html)',
        type: 'array',
        items: {
          type: 'object',
        },
        example: '620656c02c5e77db620a67d7',
      },
      currentMediaCapturePipeline: {
        description:
          'Current Chime Media Capture Pipeline if the session is being recorded. (see object returned by AWS (see https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_CreateMediaCapturePipeline.html)',
        type: 'object',
        example: '620656c02c5e77db620a67d7',
      },
      chimeMediaCapturePipelines: {
        description:
          'List of all the Chime Media Capture Pipeline that were started in the session. (see object returned by AWS (see https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_CreateMediaCapturePipeline.html)',
        type: 'array',
        items: {
          type: 'object',
        },
        example: '620656c02c5e77db620a67d7',
      },
      expert: {
        allOf: [{ $ref: '#/components/schemas/Expert' }],
      },
      consumer: {
        allOf: [{ $ref: '#/components/schemas/Consumer' }],
      },
      startDate: {
        allOf: [{ $ref: '#/components/schemas/EventDate' }],
        description: 'Start date of the session',
      },
      duration: {
        description: 'Duration of the session in minutes',
        type: 'integer',
        example: 30,
      },
      started: {
        description: 'Date that the session started',
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      ended: {
        description: 'Date that the session ended',
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      totalMilliseconds: {
        description: 'Total duration of the session in milliseconds',
        type: 'integer',
        example: 441924,
        readOnly: true,
      },
      recordings: {
        description: 'Recording files of the session',
        type: 'array',
        items: { allOf: [{ $ref: '#/components/schemas/FileTracker' }] },
      },
      createdAt: {
        type: 'string',
        description: 'Creation timestamp',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      updatedAt: {
        type: 'string',
        description: 'Last update timestamp',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      createdBy: {
        description: 'User that created session',
        allOf: [{ $ref: '#/components/schemas/User' }],
        readOnly: true,
      },
      order: {
        allOf: [{ $ref: '#/components/schemas/Order' }],
        readOnly: true,
        description: 'Order associated to this session',
      },
      notes: {
        description:
          'Notes left by the consumer for the expert at time of checkout',
        type: 'string',
        example: 'I would like to focus on this and that in our session',
      },
      cancelledAt: {
        type: 'string',
        description: 'Date that the session was cancelled',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      cancelledBy: {
        description: 'User that cancelled session',
        allOf: [{ $ref: '#/components/schemas/User' }],
        readOnly: true,
      },
      cancellationReason: {
        description: 'Reason left by the user for cancelling the session',
        type: 'string',
        example: 'Family emergency. Need to cancel our session.',
      },
      messagingChannel: {
        allOf: [{ $ref: '#/components/schemas/MessagingChannel' }],
        description: 'Messaging channel associated to this session',
      },
    },
  },
}

export const SessionAttendeeSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  SessionAttendee: {
    type: 'object',
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620656c02c5e77db620a67d7',
      },
      session: {
        description: 'Session of attendee',
        allOf: [{ $ref: '#/components/schemas/Session' }],
      },
      user: {
        description: 'User information of attendee',
        allOf: [{ $ref: '#/components/schemas/User' }],
      },
      chimeAttendee: {
        description:
          'Chime Attendee object returned by AWS (see https://docs.aws.amazon.com/chime/latest/APIReference/API_CreateAttendee.html)',
        type: 'object',
      },
    },
  },
}

export const SessionJoinInfoSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  SessionJoinInfo: {
    type: 'object',
    properties: {
      session: {
        allOf: [{ $ref: '#/components/schemas/Session' }],
        readOnly: true,
      },
      attendee: {
        allOf: [{ $ref: '#/components/schemas/SessionAttendee' }],
        readOnly: true,
      },
    },
  },
}

export const SessionStatusCountsSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  SessionStatusCounts: {
    type: 'object',
    additionalProperties: {
      type: 'integer',
    },
    example: {
      ended: 1,
      not_started: 1,
    },
  },
}

export const SessionCancellationSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  SessionCancellation: {
    type: 'object',
    properties: {
      cancellationReason: {
        description: 'Reason left by the user for cancelling the session',
        type: 'string',
        example: 'Family emergency. Need to cancel our session.',
      },
    },
  },
}

export const SessionRescheduleSchema: Record<string, OpenAPIV3_1.SchemaObject> =
  {
    SessionReschedule: {
      type: 'object',
      properties: {
        date: {
          description: 'New date for the session',
          type: 'string',
          format: 'date-time',
          example: '2022-02-16T00:00:00Z',
        },
        timeSlotId: {
          description: 'ID of the new time slot',
          type: 'string',
          example: '620656c02c5e77db620a67d7',
        },
      },
    },
  }

export const SessionExtensionRequestStatusSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  SessionExtensionRequestStatus: {
    type: 'string',
    description: 'Possible statuses of a session extension request',
    enum: getEnumValues(SessionExtensionRequestStatus),
    example: SessionExtensionRequestStatus.Requested,
  },
}

export const SessionExtensionRequestCreationSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  SessionExtensionRequestCreation: {
    type: 'object',
    properties: {
      maxDuration: {
        description:
          'Max duration that the request can have. This is defined by the expert.',
        type: 'integer',
        example: 30,
      },
      duration: {
        description: 'Total duration that will be added to the session',
        type: 'integer',
        example: 30,
      },
    },
  },
}

export const SessionExtensionRequestSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  SessionExtensionRequest: {
    type: 'object',
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620656c02c5e77db620a67d7',
      },
      session: {
        allOf: [{ $ref: '#/components/schemas/Session' }],
      },
      status: {
        description: 'Status of the request',
        allOf: [{ $ref: '#/components/schemas/SessionExtensionRequestStatus' }],
        default: SessionExtensionRequestStatus.Requested,
        example: SessionExtensionRequestStatus.Accepted,
      },
      maxDuration: {
        description:
          'Max duration that the request can have. This is defined by the expert.',
        type: 'integer',
        example: 30,
      },
      duration: {
        description: 'Total duration that will be added to the session',
        type: 'integer',
        example: 30,
      },
      requester: {
        allOf: [{ $ref: '#/components/schemas/Expert' }],
      },
      replier: {
        allOf: [{ $ref: '#/components/schemas/Consumer' }],
      },
      createdAt: {
        type: 'string',
        description: 'Creation timestamp',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      updatedAt: {
        type: 'string',
        description: 'Last update timestamp',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
    },
  },
}
