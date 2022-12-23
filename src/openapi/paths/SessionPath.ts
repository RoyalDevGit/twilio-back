import { OpenAPIV3_1 } from 'openapi-types'

import { sessionRouterPathPrefix } from 'routers/SessionRouter'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

const CreateSessionOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/': {
    get: {
      summary: 'Query Sessions',
      description: 'Query sessions',
      tags: ['sessions'],
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
        { allOf: [{ $ref: '#/components/parameters/SessionStatus' }] },
        { allOf: [{ $ref: '#/components/parameters/FromDate' }] },
        { allOf: [{ $ref: '#/components/parameters/ToDate' }] },
      ],
    },
  },
}

const SessionByIdOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{sessionId}': {
    get: {
      summary: 'Get Session',
      description: 'Get session by ID',
      tags: ['sessions'],
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
                allOf: [{ $ref: '#/components/schemas/Session' }],
              },
            },
          },
        },
        404: {
          description: 'Session not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/SessionId' }] }],
    },
  },
}

const JoinSessionOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{sessionId}/join': {
    post: {
      summary: 'Join Session',
      description: 'Allows current session to join the session',
      tags: ['sessions'],
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
                allOf: [{ $ref: '#/components/schemas/SessionJoinInfo' }],
              },
            },
          },
        },
        403: {
          description:
            'Session is not joinable (reason can be found in error.data.reason)',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Session not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/SessionId' }] }],
    },
  },
}

const EndSessionOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{sessionId}/end': {
    post: {
      summary: 'End Session',
      description: 'Ends session for all participants',
      tags: ['sessions'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        204: {
          description: 'Session was terminated successfully',
        },
        404: {
          description: 'Session not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/SessionId' }] }],
    },
  },
}

const StartRecordingOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{sessionId}/start-recording': {
    post: {
      summary: 'Start Recording',
      description: 'Starts recording in a session',
      tags: ['sessions'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        204: {
          description: 'Recording was started successfully',
        },
        404: {
          description: 'Session not found',
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
        409: {
          description: 'The session is already being recorded',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/SessionId' }] }],
    },
  },
}

const StopRecordingOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{sessionId}/stop-recording': {
    post: {
      summary: 'Stop Recording',
      description: 'Stops recording in a session',
      tags: ['sessions'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        204: {
          description: 'Recording was stopped successfully',
        },
        404: {
          description: 'Session not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/SessionId' }] }],
    },
  },
}

const GetAttendeeOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{sessionId}/attendee/{chimeAttendeeId}': {
    get: {
      summary: 'Get Attendee',
      description: 'Gets a session attendee by their chime attendee id',
      tags: ['sessions'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Recording was stopped successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/SessionAttendee' }],
              },
            },
          },
        },
        404: {
          description: 'Session not found',
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
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/SessionId' }] },
        { allOf: [{ $ref: '#/components/parameters/ChimeAttendeeId' }] },
      ],
    },
  },
}

const CancelSessionOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{sessionId}/cancel': {
    patch: {
      summary: 'Cancel Session',
      description: 'Cancels an existing session',
      tags: ['sessions'],
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
                allOf: [{ $ref: '#/components/schemas/Session' }],
              },
            },
          },
        },
        403: {
          description:
            'Session is not joinable (reason can be found in error.data.reason)',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Session not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/SessionId' }] }],
      requestBody: {
        required: true,
        description: 'Cancellation data',
        content: {
          'application/json': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/SessionCancellation' }],
            },
          },
        },
      },
    },
  },
}

const RescheduleSessionOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{sessionId}/reschedule': {
    patch: {
      summary: 'Reschedule Session',
      description: 'Reschedules an existing session',
      tags: ['sessions'],
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
                allOf: [{ $ref: '#/components/schemas/Session' }],
              },
            },
          },
        },
        403: {
          description:
            'Session is not joinable (reason can be found in error.data.reason)',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Session not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/SessionId' }] }],
      requestBody: {
        required: true,
        description: 'Reschedule data',
        content: {
          'application/json': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/SessionReschedule' }],
            },
          },
        },
      },
    },
  },
}

const MessagingChannelOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{sessionId}/messaging-channel': {
    get: {
      summary: 'Get Session Messaging Channel',
      description: 'Gets the messaging channel of the session',
      tags: ['sessions'],
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
                allOf: [{ $ref: '#/components/schemas/MessagingChannel' }],
              },
            },
          },
        },
        404: {
          description: 'Session not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/SessionId' }] }],
    },
  },
}

const CreateSessionExtensionOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{sessionId}/extensions': {
    post: {
      summary: 'Begin Extension Request',
      description: 'Begins a session extension request',
      tags: ['sessions'],
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
                allOf: [
                  { $ref: '#/components/schemas/SessionExtensionRequest' },
                ],
              },
            },
          },
        },
        404: {
          description: 'Session not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/SessionId' }] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              allOf: [
                {
                  $ref: '#/components/schemas/SessionExtensionRequestCreation',
                },
              ],
            },
          },
        },
      },
    },
  },
}

const CurrentSessionExtensionOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{sessionId}/extensions/current': {
    get: {
      summary: 'Current Extension Request',
      description: 'Gets the ongoing session extension request',
      tags: ['sessions'],
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
                allOf: [
                  { $ref: '#/components/schemas/SessionExtensionRequest' },
                ],
              },
            },
          },
        },
        404: {
          description: 'Session not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/SessionId' }] }],
    },
  },
}

const AcceptSessionExtensionOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{sessionId}/extensions/accept': {
    patch: {
      summary: 'Accept Extension Request',
      description: 'Accepts a session extension request',
      tags: ['sessions'],
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
                  { $ref: '#/components/schemas/SessionExtensionRequest' },
                ],
              },
            },
          },
        },
        404: {
          description: 'Session not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/SessionId' }] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              allOf: [
                {
                  $ref: '#/components/schemas/SessionExtensionRequestCreation',
                },
              ],
            },
          },
        },
      },
    },
  },
}

const DeclineSessionExtensionOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{sessionId}/extensions/decline': {
    patch: {
      summary: 'Decline Extension Request',
      description: 'Declines a session extension request',
      tags: ['sessions'],
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
                  { $ref: '#/components/schemas/SessionExtensionRequest' },
                ],
              },
            },
          },
        },
        404: {
          description: 'Session not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/SessionId' }] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              allOf: [
                {
                  $ref: '#/components/schemas/SessionExtensionRequestCreation',
                },
              ],
            },
          },
        },
      },
    },
  },
}

const WithdrawSessionExtensionOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{sessionId}/extensions/withdraw': {
    patch: {
      summary: 'Withdraw Extension Request',
      description: 'Withdraws a session extension request',
      tags: ['sessions'],
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
                  { $ref: '#/components/schemas/SessionExtensionRequest' },
                ],
              },
            },
          },
        },
        404: {
          description: 'Session not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/SessionId' }] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              allOf: [
                {
                  $ref: '#/components/schemas/SessionExtensionRequestCreation',
                },
              ],
            },
          },
        },
      },
    },
  },
}

export const SessionPath = mergeOpenApiPaths(
  [
    SessionByIdOperation,
    CreateSessionOperation,
    JoinSessionOperation,
    EndSessionOperation,
    StartRecordingOperation,
    StopRecordingOperation,
    GetAttendeeOperation,
    CancelSessionOperation,
    RescheduleSessionOperation,
    MessagingChannelOperation,
    CreateSessionExtensionOperation,
    CurrentSessionExtensionOperation,
    AcceptSessionExtensionOperation,
    DeclineSessionExtensionOperation,
    WithdrawSessionExtensionOperation,
  ],
  {
    pathPrefix: sessionRouterPathPrefix,
  }
)
