import { OpenAPIV3_1 } from 'openapi-types'

import { timeZoneRouterPathPrefix } from 'routers/TimeZoneRouter'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

const TimeZoneOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/': {
    get: {
      summary: 'Query Time Zones',
      description: 'Queries all time zones',
      tags: ['time zones'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Time zones query return',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  allOf: [{ $ref: '#/components/schemas/TimeZone' }],
                },
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

const TimeZoneByNameOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{timeZoneName}': {
    get: {
      summary: 'Get TimeZone',
      description: 'Gets an existing timeZone by name',
      tags: ['time zones'],
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
                allOf: [{ $ref: '#/components/schemas/TimeZone' }],
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
        404: {
          description: 'TimeZone not found',
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
        { allOf: [{ $ref: '#/components/parameters/TimeZoneName' }] },
      ],
    },
  },
}

export const TimeZonePath = mergeOpenApiPaths(
  [TimeZoneOperations, TimeZoneByNameOperations],
  {
    pathPrefix: timeZoneRouterPathPrefix,
  }
)
