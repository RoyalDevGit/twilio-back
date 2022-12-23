import { OpenAPIV3_1 } from 'openapi-types'

import { paymentMethodRouterPathPrefix } from 'routers/PaymentMethodRouter'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

const PaymentMethodOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/': {
    post: {
      summary: 'Create Payment Method',
      description: 'Creates a new payment method',
      tags: ['payment methods'],
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
                allOf: [{ $ref: '#/components/schemas/PaymentMethod' }],
              },
            },
          },
        },
        404: {
          description: 'PaymentMethod entity does not exist',
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
        description: 'PaymentMethod data',
        content: {
          'application/json': {
            schema: { allOf: [{ $ref: '#/components/schemas/PaymentMethod' }] },
          },
        },
      },
    },
    get: {
      summary: 'Query Payment Methods',
      description: 'Queries for payment methods of a related entity',
      tags: ['payment methods'],
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
        { allOf: [{ $ref: '#/components/parameters/PaymentMethodType' }] },
        { allOf: [{ $ref: '#/components/parameters/PaymentMethodStatus' }] },
      ],
    },
  },
}

const PaymentMethodByIdOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{paymentMethodId}': {
    get: {
      summary: 'Get Payment Method',
      description: 'Get payment method by ID',
      tags: ['payment methods'],
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
                allOf: [{ $ref: '#/components/schemas/PaymentMethod' }],
              },
            },
          },
        },
        404: {
          description: 'Payment method not found',
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
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/PaymentMethodId' }] },
      ],
    },
    patch: {
      summary: 'Update PaymentMethod',
      description: 'Updates an existing payment method fully or partially',
      tags: ['payment methods'],
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
                allOf: [{ $ref: '#/components/schemas/PaymentMethod' }],
              },
            },
          },
        },
        404: {
          description: 'PaymentMethod not found',
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
      parameters: [
        { allOf: [{ $ref: '#/components/parameters/PaymentMethodId' }] },
      ],
      requestBody: {
        required: true,
        description: 'PaymentMethod data',
        content: {
          'application/json': {
            schema: { allOf: [{ $ref: '#/components/schemas/PaymentMethod' }] },
          },
        },
      },
    },
    delete: {
      summary: 'Delete PaymentMethod',
      description:
        'Deletes an existing payment method and all of its associated data',
      tags: ['payment methods'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        204: {
          description: 'PaymentMethod was deleted successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/PaymentMethod' }],
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
            'If user tries to delete a payment method that they do not create',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'PaymentMethod not found',
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
        { allOf: [{ $ref: '#/components/parameters/PaymentMethodId' }] },
      ],
    },
  },
}

const PaymentMethodSyncOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/sync': {
    post: {
      summary: 'Sync Payment Methods',
      description:
        'Synchronizes payment methods that have been created in stripe with ES database',
      tags: ['payment methods'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        204: {
          description: 'Sync was successful',
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
    get: {
      summary: 'Query Payment Methods',
      description: 'Queries for payment methods of a related entity',
      tags: ['payment methods'],
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
        { allOf: [{ $ref: '#/components/parameters/PaymentMethodType' }] },
        { allOf: [{ $ref: '#/components/parameters/PaymentMethodStatus' }] },
      ],
    },
  },
}

export const PaymentMethodPath = mergeOpenApiPaths(
  [
    PaymentMethodOperations,
    PaymentMethodByIdOperations,
    PaymentMethodSyncOperation,
  ],
  {
    pathPrefix: paymentMethodRouterPathPrefix,
  }
)
