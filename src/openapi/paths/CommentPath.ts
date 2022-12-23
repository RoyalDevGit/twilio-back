import { OpenAPIV3_1 } from 'openapi-types'

import { commentRouterPathPrefix } from 'routers/CommentRouter'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

const CommentOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/': {
    post: {
      summary: 'Create Comment',
      description: 'Creates a new comment',
      tags: ['comments'],
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
                allOf: [{ $ref: '#/components/schemas/Comment' }],
              },
            },
          },
        },
        404: {
          description: 'Comment entity does not exist',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        400: {
          description: 'Bad request. Check the returned error for details',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        403: {
          description:
            'If user tries to pin a comment when they are not the owner of the related entity',
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
        description: 'Comment data',
        content: {
          'application/json': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/CommentCreation' }],
            },
          },
        },
      },
    },
    get: {
      summary: 'Query Comments',
      description: 'Queries for comments of a related entity',
      tags: ['comments'],
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
        { allOf: [{ $ref: '#/components/parameters/CommentType' }] },
        { allOf: [{ $ref: '#/components/parameters/CommentEntityType' }] },
        { allOf: [{ $ref: '#/components/parameters/CommentEntityId' }] },
        { allOf: [{ $ref: '#/components/parameters/Page' }] },
        { allOf: [{ $ref: '#/components/parameters/Limit' }] },
        { allOf: [{ $ref: '#/components/parameters/Sort' }] },
        { allOf: [{ $ref: '#/components/parameters/SortDirection' }] },
        { allOf: [{ $ref: '#/components/parameters/CreatedBy' }] },
      ],
    },
  },
}

const CommentByIdOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{commentId}': {
    patch: {
      summary: 'Update Comment',
      description: 'Updates an existing comment fully or partially',
      tags: ['comments'],
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
                allOf: [{ $ref: '#/components/schemas/Comment' }],
              },
            },
          },
        },
        404: {
          description: 'Comment not found',
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
        403: {
          description:
            'If user tries to pin a comment when they are not the owner of the related entity',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/CommentId' }] }],
      requestBody: {
        required: true,
        description: 'Comment data',
        content: {
          'application/json': {
            schema: { allOf: [{ $ref: '#/components/schemas/CommentUpdate' }] },
          },
        },
      },
    },
    delete: {
      summary: 'Delete Comment',
      description: 'Deletes an existing comment and all of its associated data',
      tags: ['comments'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        204: {
          description: 'Comment was deleted successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/Comment' }],
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
        403: {
          description:
            'If user tries to delete a comment that they do not create',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Comment not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/CommentId' }] }],
    },
  },
}

const CommentLikeOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{commentId}/like': {
    patch: {
      summary: 'Like Comment',
      description: 'Marks a comment as liked by a user',
      tags: ['comments'],
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
                allOf: [{ $ref: '#/components/schemas/Comment' }],
              },
            },
          },
        },
        409: {
          description: 'Comment has already been liked by this user',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Comment not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/CommentId' }] }],
    },
  },
}

const CommentDislikeOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{commentId}/dislike': {
    patch: {
      summary: 'Dislike Comment',
      description: 'Marks a comment as disliked by a user',
      tags: ['comments'],
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
                allOf: [{ $ref: '#/components/schemas/Comment' }],
              },
            },
          },
        },
        409: {
          description: 'Comment has already been disliked by this user',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Comment not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/CommentId' }] }],
    },
  },
}

const ClearLikeOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{commentId}/clear-like': {
    patch: {
      summary: 'Clear Comment Like Status',
      description: 'Clears user like status of a comment',
      tags: ['comments'],
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
                allOf: [{ $ref: '#/components/schemas/Comment' }],
              },
            },
          },
        },
        404: {
          description: 'Comment or comment like status not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/CommentId' }] }],
    },
  },
}

export const CommentPath = mergeOpenApiPaths(
  [
    CommentOperations,
    CommentByIdOperations,
    CommentLikeOperation,
    CommentDislikeOperation,
    ClearLikeOperation,
  ],
  {
    pathPrefix: commentRouterPathPrefix,
  }
)
