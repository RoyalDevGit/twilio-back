import { OpenAPIV3_1 } from 'openapi-types'

import { searchRouterPathPrefix } from 'routers/SearchRouter'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

const GlobalSearchOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/': {
    get: {
      summary: 'Global Search',
      description: 'Perform a global search accross experts and subcategories',
      tags: ['search'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        200: {
          description: 'List of experts and categories returned by the search',
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
        { allOf: [{ $ref: '#/components/parameters/Page' }] },
        { allOf: [{ $ref: '#/components/parameters/Limit' }] },
        { allOf: [{ $ref: '#/components/parameters/GlobalSearchIndex' }] },
      ],
    },
  },
}

export const SearchPath = mergeOpenApiPaths([GlobalSearchOperation], {
  pathPrefix: searchRouterPathPrefix,
})
