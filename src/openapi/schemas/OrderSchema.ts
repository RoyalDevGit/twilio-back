import { OpenAPIV3_1 } from 'openapi-types'

import { getEnumValues } from 'utils/enum/enumUtils'
import { OrderItemType, OrderRefundStatus, OrderStatus } from 'models/Order'

export const OrderStatusSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  OrderStatus: {
    type: 'string',
    description: 'Possible status of an order',
    enum: getEnumValues(OrderStatus),
    example: OrderStatus.Complete,
  },
}

export const OrderRefundStatusSchema: Record<string, OpenAPIV3_1.SchemaObject> =
  {
    OrderRefundStatus: {
      type: 'string',
      description: 'Possible refund status of an order',
      enum: getEnumValues(OrderRefundStatus),
      example: OrderRefundStatus.RefundRequested,
    },
  }

export const OrderItemTypeSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  OrderItemType: {
    type: 'string',
    description: 'Possible types of an order item',
    enum: getEnumValues(OrderItemType),
    example: OrderItemType.Session,
  },
}

export const SessionOrderItemSchema: Record<string, OpenAPIV3_1.SchemaObject> =
  {
    SessionOrderItem: {
      type: 'object',
      required: ['startDate', 'duration', 'expert', 'consumer'],
      properties: {
        id: {
          description: 'Auto generated UUID',
          readOnly: true,
          type: 'string',
          example: '620656c02c5e77db620a67d7',
        },
        startDate: {
          type: 'string',
          description: 'Start date of the session',
          format: 'date-time',
          example: '2022-02-16T00:00:00Z',
          readOnly: true,
        },
        expert: {
          type: 'string',
          description: 'Expert of the session',
        },
        consumer: {
          type: 'string',
          description: 'Consumer of the session',
        },
        duration: {
          description: 'Duration of the session in minutes',
          type: 'integer',
          example: 30,
        },
      },
    },
  }

export const OrderItemSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  OrderItem: {
    type: 'object',
    required: ['type', 'data', 'totalPrice'],
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620656c02c5e77db620a67d7',
      },
      itemType: {
        allOf: [{ allOf: [{ $ref: '#/components/schemas/OrderItemType' }] }],
        description: 'Type of order item',
        example: OrderItemType.Session,
      },
      data: {
        description: 'Type of order',
        // oneOf: [{ $ref: '#/components/schemas/SessionOrderItem' }],
        allOf: [{ $ref: '#/components/schemas/SessionOrderItem' }],
      },
      totalPrice: {
        allOf: [{ $ref: '#/components/schemas/Price' }],
        example: {
          currencyCode: 'usd',
          amount: 59.99,
        },
      },
    },
  },
}

export const OrderSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  Order: {
    type: 'object',
    required: ['status', 'items', 'paymentMethod'],
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620656c02c5e77db620a67d7',
      },
      status: {
        allOf: [{ $ref: '#/components/schemas/OrderStatus' }],
        readOnly: true,
        description: 'Current status of order',
        example: OrderStatus.Complete,
      },
      stripeOrderId: {
        readOnly: true,
        type: 'string',
        description: 'Auto generated order ID from Stripe',
        example: 'pi_1L2x48Kq0PhFh4ntilutn7a5',
      },
      stripeOrderClientSecret: {
        readOnly: true,
        type: 'string',
        description:
          'Auto generated setup intent client secret key from Stripe',
        example:
          'pi_1L2x48Kq0PhFh4ntilutn7a5_secret_LkRyzzz0pWTR2nVbzwWZ9LL4acGH4gu',
      },
      items: {
        description: 'Order detail items',
        type: 'array',
        items: {
          allOf: [{ $ref: '#/components/schemas/OrderItem' }],
        },
      },
      totalPrice: {
        allOf: [{ $ref: '#/components/schemas/Price' }],
        readOnly: true,
      },
      paymentMethod: {
        allOf: [{ $ref: '#/components/schemas/PaymentMethod' }],
      },
      createdBy: {
        type: 'string',
        description: 'UUID of user that created this user',
        example: '620656c02c5e77db620a67d7',
        readOnly: true,
      },
      createdAt: {
        type: 'string',
        description: 'Creation timestamp',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      updatedAt: {
        type: 'string',
        description: 'Last update timestamp',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
    },
  },
}

export const RefundRequestSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  RefundRequest: {
    type: 'object',
    required: ['status', 'order', 'description'],
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620656c02c5e77db620a67d7',
      },
      status: {
        allOf: [{ $ref: '#/components/schemas/OrderRefundStatus' }],
        description: 'Current status of the refund',
        example: OrderRefundStatus.RefundRequested,
      },
      description: {
        type: 'string',
        description: 'Description of why the refund is being request',
        example:
          'I want a refund because the expert was not particularly great...',
      },
      order: {
        allOf: [{ $ref: '#/components/schemas/Order' }],
      },
      createdBy: {
        type: 'string',
        description: 'UUID of user that created this user',
        example: '620656c02c5e77db620a67d7',
        readOnly: true,
      },
      createdAt: {
        type: 'string',
        description: 'Creation timestamp',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      updatedAt: {
        type: 'string',
        description: 'Last update timestamp',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
    },
  },
}
