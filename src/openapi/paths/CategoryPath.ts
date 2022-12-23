import { OpenAPIV3_1 } from 'openapi-types'

import { categoryRouterPathPrefix } from 'routers/CategoryRouter'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

const GetRecommendedCategoriesOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/recommended': {
    get: {
      summary: 'Get Recommended Categories',
      description: 'Gets recommended categories of the user',
      tags: ['categories'],
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
          description: 'Categories query return',
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
        { allOf: [{ $ref: '#/components/parameters/CategoryOnly' }] },
      ],
    },
  },
}

const CategoryOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/': {
    post: {
      summary: 'Create Category',
      description: 'Creates a new category.',
      tags: ['categories'],
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
                allOf: [{ $ref: '#/components/schemas/Category' }],
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
        description: 'Category data',
        content: {
          'multipart/form-data': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/CategoryMultipartForm' }],
            },
          },
        },
      },
    },
    get: {
      summary: 'Query Categories',
      description: 'Queries all categories',
      tags: ['categories'],
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
          description: 'Categories query return',
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
        { allOf: [{ $ref: '#/components/parameters/CategoryOnly' }] },
      ],
    },
  },
}

const CategoryByIdOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{categoryId}': {
    patch: {
      summary: 'Update Category',
      description: 'Updates an existing category fully or partially',
      tags: ['categories'],
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
                allOf: [{ $ref: '#/components/schemas/Category' }],
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/CategoryId' }] }],
      requestBody: {
        required: true,
        description: 'Category data',
        content: {
          'multipart/form-data': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/CategoryMultipartForm' }],
            },
          },
        },
      },
    },
    get: {
      summary: 'Get Category',
      description: 'Gets an existing category by ID',
      tags: ['categories'],
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
                allOf: [{ $ref: '#/components/schemas/Category' }],
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
          description: 'Category or category instance not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/CategoryId' }] }],
    },
  },
}

const SearchSubcategoriesOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/subcategories/search': {
    get: {
      summary: 'Search Subcategories',
      description: 'Search for Subcategories',
      tags: ['categories'],
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
  '/subcategories/reindex': {
    post: {
      summary: 'Reindex Subcategories',
      description: 'Updates all categories in the open search index',
      tags: ['categories'],
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

export const CategoryPath = mergeOpenApiPaths(
  [
    CategoryOperations,
    CategoryByIdOperations,
    SearchSubcategoriesOperation,
    GetRecommendedCategoriesOperations,
    ReindexOperation,
  ],
  {
    pathPrefix: categoryRouterPathPrefix,
  }
)
