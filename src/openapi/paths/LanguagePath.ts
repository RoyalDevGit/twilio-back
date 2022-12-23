import { OpenAPIV3_1 } from 'openapi-types'

import { languageRouterPathPrefix } from 'routers/LanguageRouter'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

const LanguageOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/': {
    post: {
      summary: 'Create Language',
      description: 'Creates a new language.',
      tags: ['languages'],
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
                allOf: [{ $ref: '#/components/schemas/Language' }],
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
        description: 'Language data',
        content: {
          'multipart/form-data': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/LanguageMultipartForm' }],
            },
          },
        },
      },
    },
    get: {
      summary: 'Query Languages',
      description: 'Queries all languages',
      tags: ['languages'],
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
          description: 'Languages query return',
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
      ],
    },
  },
}

const LanguageByIdOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{languageId}': {
    patch: {
      summary: 'Update Language',
      description: 'Updates an existing language fully or partially',
      tags: ['languages'],
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
                allOf: [{ $ref: '#/components/schemas/Language' }],
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/LanguageId' }] }],
      requestBody: {
        required: true,
        description: 'Language data',
        content: {
          'multipart/form-data': {
            schema: {
              allOf: [{ $ref: '#/components/schemas/LanguageMultipartForm' }],
            },
          },
        },
      },
    },
    get: {
      summary: 'Get Language',
      description: 'Gets an existing language by ID',
      tags: ['languages'],
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
                allOf: [{ $ref: '#/components/schemas/Language' }],
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
          description: 'Language or language instance not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/LanguageId' }] }],
    },
  },
}

const SearchLanguagesOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/search': {
    get: {
      summary: 'Search Languages',
      description: 'Search for languages',
      tags: ['languages'],
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
      summary: 'Reindex Languages',
      description: 'Updates all languages in the open search index',
      tags: ['languages'],
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

export const LanguagePath = mergeOpenApiPaths(
  [
    LanguageOperations,
    LanguageByIdOperations,
    SearchLanguagesOperation,
    ReindexOperation,
  ],
  {
    pathPrefix: languageRouterPathPrefix,
  }
)
