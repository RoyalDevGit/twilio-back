import { OpenAPIV3_1 } from 'openapi-types'

export const SearchResultSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  SearchResult: {
    description: 'Request of a query',
    type: 'object',
    properties: {
      schema: {
        allOf: [{ $ref: '#/components/schemas/QueryResponse' }],
      },
      took: {
        description: 'Total milliseconds that it took to complete the search',
        type: 'integer',
        example: 30,
      },
      timedOut: {
        description: 'Whether the search timed out or not',
        type: 'boolean',
        example: false,
      },
    },
  },
}
