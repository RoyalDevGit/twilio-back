import { OpenAPIV3_1 } from 'openapi-types'

import { eventRouterPathPrefix } from 'routers/EventRouter'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

const EventByIdOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{eventId}': {
    patch: {
      summary: 'Update Event',
      description: 'Updates an existing event fully or partially',
      tags: ['events'],
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
                allOf: [{ $ref: '#/components/schemas/Event' }],
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/EventId' }] }],
      requestBody: {
        required: true,
        description: 'Event data',
        content: {
          'application/json': {
            schema: { allOf: [{ $ref: '#/components/schemas/Event' }] },
          },
        },
      },
    },
    delete: {
      summary: 'Delete Event',
      description: 'Deletes an existing event',
      tags: ['events'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        204: {
          description: 'Event was deleted successfully',
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
        404: {
          description: 'Event or event instance not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/EventId' }] }],
    },
    get: {
      summary: 'Get Event',
      description: 'Gets an existing event by ID',
      tags: ['events'],
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
                allOf: [{ $ref: '#/components/schemas/Event' }],
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
        404: {
          description: 'Event or event instance not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/EventId' }] }],
    },
  },
}

const EventReservationOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{eventId}/reservations': {
    post: {
      summary: 'Create Reservation',
      description: 'Creates a new reservation',
      tags: ['event reservations'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        201: {
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/EventReservation' }],
              },
            },
          },
        },
        409: {
          description: 'The reservation already exists',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Event or event instance not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/EventId' }] }],
      requestBody: {
        description: 'Event Reservation data',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/EventReservationCreation' },
              ],
            },
          },
        },
      },
    },
  },
}

const EventReservationByIdOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{eventId}/reservations/{reservationId}': {
    delete: {
      summary: 'Cancel Reservation',
      description: 'Cancels an existing reservation',
      tags: ['event reservations'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        204: {
          description: 'Reservation was successfully cancelled',
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
        { allOf: [{ $ref: '#/components/parameters/EventId' }] },
        { allOf: [{ $ref: '#/components/parameters/EventReservationId' }] },
      ],
    },
  },
}

export const EventPath = mergeOpenApiPaths(
  [
    EventByIdOperations,
    EventReservationOperations,
    EventReservationByIdOperations,
  ],
  {
    pathPrefix: eventRouterPathPrefix,
  }
)
