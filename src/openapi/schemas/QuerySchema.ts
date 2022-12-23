import { OpenAPIV3_1 } from 'openapi-types'

export const QueryRequestSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  QueryRequest: {
    description: 'Request of a query',
    type: 'object',
    properties: {
      page: {
        description: 'Number of page to retrieve',
        type: 'integer',
        example: 1,
        default: 1,
      },
      limit: {
        description: 'Number of records to retrieve in a single page',
        type: 'integer',
        example: 10,
        default: 10,
      },
    },
  },
}

export const QueryResponseSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  QueryResponse: {
    type: 'object',
    description: 'Result of a query',
    properties: {
      items: {
        description: 'Array of items returned by the query',
        type: 'array',
        items: {
          type: 'object',
        },
        example: [
          { firstName: 'John', lastName: 'Doe' },
          { firstName: 'Jane', lastName: 'Doe' },
        ],
      },
      total: {
        description: 'Total number of items that matched the query',
        type: 'integer',
        example: 100,
      },
      page: {
        description: 'Number of page that was retrieved',
        type: 'integer',
        example: 1,
      },
      offset: {
        description: 'Offset of starting item',
        type: 'integer',
        example: 1,
      },
      limit: {
        description:
          'Maximum number of records that were retrieved for a single page',
        type: 'integer',
        example: 10,
      },
      totalPages: {
        description: 'Total number of pages',
        type: 'integer',
        example: 1,
      },
      hasPrevPage: {
        description: 'Availability of previous page',
        type: 'boolean',
        example: false,
      },
      hasNextPage: {
        description: 'Availability of next page',
        type: 'boolean',
        example: true,
      },
      pagingCounter: {
        description:
          'The starting index/serial/chronological number of first document in current page. (Eg: if page=2 and limit=10, then pagingCounter will be 11)',
        type: 'integer',
        example: 30,
      },
    },
  },
}
