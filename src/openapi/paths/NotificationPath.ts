import { OpenAPIV3_1 } from 'openapi-types'

import { notificationsRouterPathPrefix } from 'routers/NotificationRouter'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

const NotificationOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/preferences/': {
    get: {
      summary: 'Get Preferences',
      description: 'Get User Notification Preferences',
      tags: ['notifications'],
      security: [
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
                  {
                    $ref: '#/components/schemas/NotificationResponse',
                  },
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
    },
    patch: {
      summary: 'Update Preferences',
      description: 'Update User Notification Preferences',
      tags: ['notifications'],
      security: [
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
                  {
                    $ref: '#/components/schemas/NotificationPreferenceResponse',
                  },
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
      requestBody: {
        description: 'Notification Channels',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/NotificationPreferenceResponse' },
              ],
            },
          },
        },
      },
    },
  },
}

const NotificationQueueOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/': {
    get: {
      summary: 'Query Notifications',
      description: 'Query Notifications',
      tags: ['notifications'],
      security: [
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
                  {
                    $ref: '#/components/schemas/NotificationQueueResponse',
                  },
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
        { allOf: [{ $ref: '#/components/parameters/Page' }] },
        { allOf: [{ $ref: '#/components/parameters/Limit' }] },
        { allOf: [{ $ref: '#/components/parameters/NotificationStatus' }] },
        { allOf: [{ $ref: '#/components/parameters/FromDate' }] },
        { allOf: [{ $ref: '#/components/parameters/ToDate' }] },
        { allOf: [{ $ref: '#/components/parameters/Sort' }] },
        { allOf: [{ $ref: '#/components/parameters/SortDirection' }] },
      ],
    },
  },
}

const NotificationTestOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/test': {
    post: {
      summary: 'Test Notification',
      description: 'Queue a test notification',
      tags: ['notifications'],
      security: [
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
                  { $ref: '#/components/schemas/NotificationItemResponse' },
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
    },
  },
}

const NotificationReadOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/mark-as-read': {
    post: {
      summary: 'Mark Notifications as Read',
      description:
        'Mark several notifications as read. Only notifications with status of "sent" and target channel of "notification_tray" will be marked as read.',
      tags: ['notifications'],
      security: [
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
                  { $ref: '#/components/schemas/NotificationItemResponse' },
                ],
              },
            },
          },
        },
        404: {
          description: 'Notification ID not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
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
      requestBody: {
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/MarkNotificationAsReadPayload' },
              ],
            },
          },
        },
      },
    },
  },
}

export const NotificationPath = mergeOpenApiPaths(
  [
    NotificationQueueOperations,
    NotificationReadOperations,
    NotificationOperations,
    NotificationTestOperations,
  ],
  {
    pathPrefix: notificationsRouterPathPrefix,
  }
)
