import { OpenAPIV3_1 } from 'openapi-types'

import { videoRouterPathPrefix } from 'routers/VideoRouter'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

const VideoByIdOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{videoId}': {
    get: {
      summary: 'Get Video',
      description: 'Gets an existing video by ID',
      tags: ['videos'],
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
                allOf: [{ $ref: '#/components/schemas/Video' }],
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/VideoId' }] }],
    },
    patch: {
      summary: 'Update Video',
      description: 'Updates an existing video fully or partially',
      tags: ['videos'],
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
                allOf: [{ $ref: '#/components/schemas/Video' }],
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/VideoId' }] }],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/VideoUpdate' }],
            },
          },
        },
      },
    },
    delete: {
      summary: 'Delete Video',
      description: 'Deletes an existing video',
      tags: ['videos'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        204: {
          description: 'Video was deleted successfully',
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
          description: 'Video not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/VideoId' }] }],
    },
  },
}

const FavoriteOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{videoId}/favorite': {
    patch: {
      summary: 'Favorite Video',
      description: 'Mark the video as favorited by the current user',
      tags: ['videos'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Updated video',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/Video' }],
              },
            },
          },
        },
        409: {
          description: 'Video has already been favorited by this user',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Video not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/VideoId' }] }],
    },
  },
}

const UnfavoriteOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{videoId}/unfavorite': {
    patch: {
      summary: 'Unfavorite Video',
      description: 'Mark the video as favorited by the current user',
      tags: ['videos'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'Updated video',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/Video' }],
              },
            },
          },
        },
        404: {
          description: 'Video not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/VideoId' }] }],
    },
  },
}

const BaseOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/': {
    get: {
      summary: 'Query Videos',
      description: 'Queries videos',
      tags: ['videos'],
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
        { allOf: [{ $ref: '#/components/parameters/Favorites' }] },
        {
          allOf: [{ allOf: [{ $ref: '#/components/parameters/ExpertId' }] }],
          in: 'query',
          required: false,
          example: '',
        },
      ],
    },
  },
}

export const VideoPath = mergeOpenApiPaths(
  [BaseOperations, VideoByIdOperations, FavoriteOperation, UnfavoriteOperation],
  {
    pathPrefix: videoRouterPathPrefix,
  }
)
