import { OpenAPIV3_1 } from 'openapi-types'

import { UserStatus } from 'models/User'
import { userRouterPathPrefix } from 'routers/UserRouter'
import { getEnumValues } from 'utils/enum/enumUtils'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

export const UserStatusSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  UserStatus: {
    type: 'string',
    description: 'Possible status of a user',
    enum: getEnumValues(UserStatus),
    example: UserStatus.Available,
  },
}

const CurrentUserOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/me': {
    get: {
      summary: 'Current User Profile',
      description: 'Returns the user profile information',
      tags: ['users'],
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
                allOf: [{ $ref: '#/components/schemas/User' }],
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

const UpdateUserOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{userId}': {
    patch: {
      summary: 'Update User',
      description:
        'Updates a user fully or partially and returns the updated user',
      tags: ['users'],
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
                allOf: [{ $ref: '#/components/schemas/User' }],
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/UserId' }] }],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/UserUpdate' }],
            },
          },
        },
      },
    },
  },
}

const GetLinkedExpertOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{userId}/expert': {
    get: {
      summary: 'Get Expert by User',
      description: 'Gets the expert linked to the specified user',
      tags: ['users'],
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
                allOf: [{ $ref: '#/components/schemas/Expert' }],
              },
            },
          },
        },
        404: {
          description: 'User or expert not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/UserId' }] }],
    },
  },
}

const GetSessionCountsOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{userId}/session-counts': {
    get: {
      summary: 'Get User Session Counts',
      description: 'Gets a count of all the sessions of the user by status',
      tags: ['users'],
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
                allOf: [{ $ref: '#/components/schemas/SessionStatusCounts' }],
              },
            },
          },
        },
        404: {
          description: 'User not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/UserId' }] }],
    },
  },
}

const UpdateStatusOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{userId}/status': {
    patch: {
      summary: 'Update Status',
      description: 'Updates the status of an expert',
      tags: ['experts'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Updated user',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/User' }],
              },
            },
          },
        },
        404: {
          description: 'User not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/UserId' }] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/UserStatusUpdate' }],
            },
          },
        },
      },
    },
  },
}

export const UserPath = mergeOpenApiPaths(
  [
    CurrentUserOperation,
    UpdateUserOperation,
    GetLinkedExpertOperation,
    GetSessionCountsOperation,
    UpdateStatusOperations,
  ],
  {
    pathPrefix: userRouterPathPrefix,
  }
)
