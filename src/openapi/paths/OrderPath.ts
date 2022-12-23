import { OpenAPIV3_1 } from 'openapi-types'

import { orderRouterPathPrefix } from 'routers/OrderRouter'
import { mergeOpenApiPaths } from 'utils/openapi/mergeOpenApiPaths'

const OrderOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/': {
    post: {
      summary: 'Create Order',
      description: 'Creates a new order',
      tags: ['orders'],
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
                allOf: [{ $ref: '#/components/schemas/Order' }],
              },
            },
          },
        },
        404: {
          description: 'Order entity does not exist',
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
        description: 'Order data',
        content: {
          'application/json': {
            schema: { allOf: [{ $ref: '#/components/schemas/Order' }] },
          },
        },
      },
    },
    get: {
      summary: 'Query Orders',
      description: 'Queries for orders of a related entity',
      tags: ['orders'],
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
        { allOf: [{ $ref: '#/components/parameters/Sort' }] },
        { allOf: [{ $ref: '#/components/parameters/SortDirection' }] },
        { allOf: [{ $ref: '#/components/parameters/OrderStatus' }] },
        { allOf: [{ $ref: '#/components/parameters/FromDate' }] },
        { allOf: [{ $ref: '#/components/parameters/ToDate' }] },
        {
          allOf: [{ $ref: '#/components/parameters/SessionStatus' }],
          name: 'sessionStatus',
        },
      ],
    },
  },
}

const OrderByIdOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{orderId}': {
    get: {
      summary: 'Get Order',
      description: 'Get order by ID',
      tags: ['orders'],
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
                allOf: [{ $ref: '#/components/schemas/Order' }],
              },
            },
          },
        },
        404: {
          description: 'Order not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/OrderId' }] }],
    },
    patch: {
      summary: 'Update Order',
      description: 'Updates an existing order fully or partially',
      tags: ['orders'],
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
                allOf: [{ $ref: '#/components/schemas/Order' }],
              },
            },
          },
        },
        404: {
          description: 'Order not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/OrderId' }] }],
      requestBody: {
        required: true,
        description: 'Order data',
        content: {
          'application/json': {
            schema: { allOf: [{ $ref: '#/components/schemas/Order' }] },
          },
        },
      },
    },
    delete: {
      summary: 'Delete Order',
      description: 'Deletes an existing order and all of its associated data',
      tags: ['orders'],
      security: [
        {
          bearerToken: [],
        },
      ],
      responses: {
        204: {
          description: 'Order was deleted successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/Order' }],
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
            'If user tries to delete a order that they do not create',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
        404: {
          description: 'Order not found',
          content: {
            'application/json': {
              schema: {
                allOf: [{ $ref: '#/components/schemas/ApiError' }],
              },
            },
          },
        },
      },
      parameters: [{ allOf: [{ $ref: '#/components/parameters/OrderId' }] }],
    },
  },
}

const CurrentOrderOperations: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/current': {
    get: {
      summary: 'Get Current Order',
      description: 'Gets the current order of the user',
      tags: ['orders'],
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
                allOf: [{ $ref: '#/components/schemas/Order' }],
              },
            },
          },
        },
        204: {
          description: 'No current order was found',
        },
        404: {
          description: 'Order not found',
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
    },
  },
}

const ProcessOrderOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{orderId}/process': {
    post: {
      summary: 'Process Order',
      description: 'Charges the customer and processes the order',
      tags: ['orders'],
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
                allOf: [{ $ref: '#/components/schemas/Order' }],
              },
            },
          },
        },
        404: {
          description: 'Order not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/OrderId' }] }],
    },
  },
}

const RequestRefundOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{orderId}/request-refund': {
    post: {
      summary: 'Request Order Refund',
      description: 'Request a refund for an order',
      tags: ['orders'],
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
                allOf: [{ $ref: '#/components/schemas/Order' }],
              },
            },
          },
        },
        404: {
          description: 'Order not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/OrderId' }] }],
      requestBody: {
        description: 'Order data',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'Description of why the refund is being request',
                  example:
                    'I want a refund because the expert was not particularly great...',
                },
              },
            },
          },
        },
      },
    },
  },
}

const UpdateFailedPaymentOperation: OpenAPIV3_1.PathsObject = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  '/{orderId}/update-failed-payment': {
    patch: {
      summary: 'Update Failed Payment',
      description:
        'Update payment method of an order with a failed payment status',
      tags: ['orders'],
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
                allOf: [{ $ref: '#/components/schemas/Order' }],
              },
            },
          },
        },
        404: {
          description: 'Order not found',
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
      parameters: [{ allOf: [{ $ref: '#/components/parameters/OrderId' }] }],
      requestBody: {
        description: 'Order data',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                paymentMethodId: {
                  type: 'string',
                  description: 'ID of new payment method',
                  example: '621fbdb422d5b985544406a1',
                },
              },
            },
          },
        },
      },
    },
  },
}

export const OrderPath = mergeOpenApiPaths(
  [
    OrderOperations,
    OrderByIdOperations,
    CurrentOrderOperations,
    ProcessOrderOperation,
    RequestRefundOperation,
    UpdateFailedPaymentOperation,
  ],
  {
    pathPrefix: orderRouterPathPrefix,
  }
)
