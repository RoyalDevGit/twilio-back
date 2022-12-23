import { OpenAPIV3_1 } from 'openapi-types'

import { messagingRouterPathPrefix } from 'routers/MessagingRouter'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

const ChannelOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/channels': {
    get: {
      summary: 'Query Channels',
      description:
        'Query through all the channels in which you are participating',
      tags: ['messaging'],
      security: [
        {
          apiKeyAuth: [],
        },
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Messaging channel query return',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/QueryResponse' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/Page' }] },
        { allOf: [{ $ref: '#/components/parameters/Limit' }] },
        { allOf: [{ $ref: '#/components/parameters/Sort' }] },
        { allOf: [{ $ref: '#/components/parameters/SortDirection' }] },
        {
          allOf: [
            { $ref: '#/components/parameters/MessagingChannelOnlyStarted' },
            { $ref: '#/components/parameters/MessagingChannelStatus' },
          ],
        },
      ],
    },
  },
}

const MessagesOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/channels/{channelId}/messages': {
    post: {
      summary: 'Send Channel Message',
      description: 'Send a new message within a channel',
      tags: ['messaging'],
      security: [
        {
          apiKeyAuth: [],
        },
      ],
      responses: {
        201: {
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ChannelMessage' }],
              },
            },
          },
        },
        400: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/MessagingChannelId' }] },
      ],
      requestBody: {
        required: true,
        description: 'Message data',
        content: {
          'multipart/form-data': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/ChannelMessageMultipartForm' },
              ],
            },
          },
        },
      },
    },
    get: {
      summary: 'Paginate Messages',
      description: 'Paginates through messages within a channel',
      tags: ['messaging'],
      security: [
        {
          apiKeyAuth: [],
        },
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Messages query return',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/QueryResponse' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/MessagingChannelId' }] },
        {
          allOf: [
            { $ref: '#/components/parameters/MessagingPaginationNextToken' },
          ],
        },
        { allOf: [{ $ref: '#/components/parameters/Limit' }] },
      ],
    },
  },
}

const MarkAsReadOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/channels/{channelId}/mark-as-read': {
    patch: {
      summary: 'Mark Channel as Read',
      description: 'Marks a channel as read for the current user',
      tags: ['messaging'],
      security: [
        {
          apiKeyAuth: [],
        },
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/MessagingChannel' }],
              },
            },
          },
        },
        401: {
          description: 'API key is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/MessagingChannelId' }] },
      ],
    },
  },
}

const SetStatusOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/channels/{channelId}/open-status': {
    patch: {
      summary: 'Set Channel Open Status',
      description: 'Set the channel open status for the current user',
      tags: ['messaging'],
      security: [
        {
          apiKeyAuth: [],
        },
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/MessagingChannel' }],
              },
            },
          },
        },
        401: {
          description: 'API key is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/MessagingChannelId' }] },
      ],
      requestBody: {
        required: true,
        description: 'Update data',
        content: {
          'application/json': {
            schema: {
              allOf: [
                {
                  $ref: '#/components/schemas/SetMessagingChannelStatusBody',
                },
              ],
            },
          },
        },
      },
    },
  },
}

const ChannelByArnOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/channels/arn/{chimeChatChannelArn}': {
    get: {
      summary: 'Get Channel by ARN',
      description: 'Gets a messaging channel by its AWS ARN',
      tags: ['messaging'],
      security: [
        {
          apiKeyAuth: [],
        },
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/MessagingChannel' }],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/ChimeChatChannelArn' }] },
      ],
    },
  },
}

const MessageMetadataOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/messages/{chimeMessageId}': {
    get: {
      summary: 'Get Message Metadata',
      description: 'Gets the metadata and attachments of a message',
      tags: ['messaging'],
      security: [
        {
          apiKeyAuth: [],
        },
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ChannelMessageMetadata' },
                ],
              },
            },
          },
        },
        401: {
          description: 'Bearer token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [
        {
          allOf: [{ $ref: '#/components/parameters/ChimeMessageId' }],
        },
      ],
    },
  },
}

export const MessagingPath = mergeOpenApiPaths(
  [
    ChannelOperations,
    MessagesOperations,
    MarkAsReadOperation,
    SetStatusOperation,
    ChannelByArnOperations,
    MessageMetadataOperations,
  ],
  {
    pathPrefix: messagingRouterPathPrefix,
  }
)
