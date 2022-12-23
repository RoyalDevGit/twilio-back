import { OpenAPIV3_1 } from 'openapi-types'

import { articleRouterPathPrefix } from 'routers/ArticleRouter'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

const ArticleOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/': {
    post: {
      summary: 'Create Article',
      description: 'Creates a new article.',
      tags: ['Articles'],
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
                allOf: [{ $ref: '#/components/schemas/Article' }],
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
      requestBody: {
        required: true,
        description: 'Article data',
        content: {
          'multipart/form-data': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/ArticleMultipartForm' }],
            },
          },
        },
      },
    },
    get: {
      summary: 'Query Articles',
      description: 'Queries all Articles',
      tags: ['Articles'],
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
          description: 'Articles query return',
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
        { allOf: [{ $ref: '#/components/parameters/ArticleOnly' }] },
      ],
    },
  },
}

const ArticleByIdOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{articleId}': {
    patch: {
      summary: 'Update Article',
      description: 'Updates an existing article fully or partially',
      tags: ['Articles'],
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
                allOf: [{ $ref: '#/components/schemas/Article' }],
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ArticleId' }] }],
      requestBody: {
        required: true,
        description: 'Article data',
        content: {
          'multipart/form-data': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/ArticleMultipartForm' }],
            },
          },
        },
      },
    },
    get: {
      summary: 'Get Article',
      description: 'Gets an existing article by ID',
      tags: ['Articles'],
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
                allOf: [{ $ref: '#/components/schemas/Article' }],
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
          description: 'Article or article instance not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/ArticleId' }] }],
    },
  },
}

const SearchArticlesOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/search': {
    get: {
      summary: 'Search articles',
      description: 'Search for articles',
      tags: ['Articles'],
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
          description: 'List of languages returned by the search',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/SearchResult' }],
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
        { allOf: [{ $ref: '#/components/parameters/SearchQuery' }] },
      ],
    },
  },
}

const ReindexOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/reindex': {
    post: {
      summary: 'Reindex articles',
      description: 'Updates all Articles in the open search index',
      tags: ['Articles'],
      security: [
        {
          apiKeyAuth: [],
        },
      ],
      responses: {
        204: {
          description: 'Reindex was successful',
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
    },
  },
}

export const ArticlePath = mergeOpenApiPaths(
  [
    ArticleOperations,
    ArticleByIdOperations,
    SearchArticlesOperation,
    ReindexOperation,
  ],
  {
    pathPrefix: articleRouterPathPrefix,
  }
)
