import { OpenAPIV3_1 } from 'openapi-types'

import { MessagingChannelStatus } from 'models/MessagingChannel'
import { getEnumValues } from 'utils/enum/enumUtils'

export const MessagingChannelStatusSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  MessagingChannelStatus: {
    type: 'string',
    enum: getEnumValues(MessagingChannelStatus),
    example: MessagingChannelStatus.Closed,
  },
}

export const MessagingChannelSchema: Record<string, OpenAPIV3_1.SchemaObject> =
  {
    MessagingChannel: {
      type: 'object',
      properties: {
        id: {
          description: 'Auto generated UUID',
          readOnly: true,
          type: 'string',
          example: '620bdbb1cc995611e5c54dc9',
        },
        chimeChatChannelArn: {
          description: 'ARN of Chime messaging channel',
          type: 'string',
          example: 'arn:aws:*********',
        },
        participants: {
          description: 'Participants that are in the messaging channel',
          type: 'array',
          items: {
            allOf: [{ $ref: '#/components/schemas/User' }],
          },
        },
        unreadCount: {
          description: 'Number of unread messages for the current user',
          type: 'integer',
          example: 12,
          readOnly: true,
        },
        status: {
          allOf: [{ $ref: '#/components/schemas/MessagingChannelStatus' }],
          description: 'Open status of messaging channel for the current user',
          example: MessagingChannelStatus.Open,
          readOnly: true,
        },
        lastMessage: {
          allOf: [{ $ref: '#/components/schemas/ChannelMessage' }],
          description: 'Last message sent in the channel',
          type: 'string',
          format: 'binary',
        },
      },
    },
  }

export const ChannelMessageCreationSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  ChannelMessageCreation: {
    type: 'object',
    properties: {
      content: {
        description: 'message content',
        type: 'string',
        example: 'Hello, I am Lia and I need help with this and that',
      },
    },
  },
}

export const ChannelMessageMultipartFormSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  ChannelMessageMultipartForm: {
    type: 'object',
    properties: {
      attachments: {
        description: 'Attachments for this message',
        type: 'array',
        items: {
          type: 'string',
          format: 'binary',
        },
      },
      messageData: {
        allOf: [{ $ref: '#/components/schemas/ChannelMessageCreation' }],
        description: 'Update data in JSON format',
      },
    },
  },
}

export const SetMessagingChannelStatusBodySchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  SetMessagingChannelStatusBody: {
    type: 'object',
    properties: {
      status: {
        allOf: [{ $ref: '#/components/schemas/MessagingChannelStatus' }],
        description: 'Open status of messaging channel for the current user',
        example: MessagingChannelStatus.Open,
      },
    },
  },
}

export const ChannelMessageSenderInfoSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  ChannelMessageSenderInfo: {
    type: 'object',
    properties: {
      firstName: {
        description: 'First name of sender',
        type: 'string',
        example: 'Jane',
      },
      lastName: {
        description: 'Last name of sender',
        type: 'string',
        example: 'Doe',
      },
    },
  },
}

export const ChannelMessageEmbeddedMetadataSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  ChannelMessageEmbeddedMetadata: {
    type: 'object',
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620bdbb1cc995611e5c54dc9',
      },
      sender: {
        allOf: [{ $ref: '#/components/schemas/ChannelMessageSenderInfo' }],
        description: 'Sender information',
      },
      attachmentCount: {
        description: 'Total attachments contained in the message',
        type: 'integer',
        example: 5,
      },
    },
  },
}

export const ChannelMessageSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  ChannelMessage: {
    type: 'object',
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620bdbb1cc995611e5c54dc9',
      },
      content: {
        description: 'Message content',
        type: 'string',
        example: 'Hello, I am Lia and I need help with this and that',
      },
      sender: {
        allOf: [{ $ref: '#/components/schemas/ChannelMessageSenderInfo' }],
        description: 'Sender information',
      },
      attachmentCount: {
        description: 'Total attachments contained in the message',
        type: 'integer',
        example: 5,
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
