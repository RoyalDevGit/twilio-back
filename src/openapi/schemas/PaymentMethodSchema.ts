import { OpenAPIV3_1 } from 'openapi-types'

import { getEnumValues } from 'utils/enum/enumUtils'
import { PaymentMethodStatus, PaymentMethodType } from 'models/PaymentMethod'

export const PaymentMethodStatusSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  PaymentMethodStatus: {
    type: 'string',
    description: 'Possible status of a payment method',
    enum: getEnumValues(PaymentMethodStatus),
    example: PaymentMethodStatus.Ready,
  },
}

export const PaymentMethodTypeSchema: Record<string, OpenAPIV3_1.SchemaObject> =
  {
    PaymentMethodType: {
      type: 'string',
      description: 'Possible types of a payment method',
      enum: getEnumValues(PaymentMethodType),
      example: PaymentMethodType.CreditCard,
    },
  }

export const CardPaymentMethodSchema: Record<string, OpenAPIV3_1.SchemaObject> =
  {
    CardPaymentMethod: {
      type: 'object',
      required: ['status', 'paymentMethodType'],
      properties: {
        brand: {
          type: 'string',
          readOnly: true,
          description: 'Brand of the card',
          example: 'visa',
        },
        last4: {
          type: 'string',
          readOnly: true,
          description: 'Last 4 digits of the card',
          example: '1234',
        },
        expirationMonth: {
          type: 'integer',
          readOnly: true,
          description: 'Expiration month of card',
          example: 2,
        },
        expirationYear: {
          type: 'integer',
          readOnly: true,
          description: 'Expiration year of card',
          example: 2052,
        },
        funding: {
          type: 'string',
          readOnly: true,
          description:
            'Card funding type. Can be credit, debit, prepaid, or unknown',
          example: 'credit',
        },
      },
    },
  }

export const PaymentMethodSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  PaymentMethod: {
    type: 'object',
    required: ['status', 'paymentMethodType'],
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620656c02c5e77db620a67d7',
      },
      status: {
        allOf: [
          { allOf: [{ $ref: '#/components/schemas/PaymentMethodStatus' }] },
        ],
        readOnly: true,
        description: 'Current status of payment method',
        example: PaymentMethodStatus.Ready,
      },
      paymentMethodType: {
        description: 'Type of payment method',
        allOf: [{ $ref: '#/components/schemas/PaymentMethodType' }],
        example: PaymentMethodType.CreditCard,
      },
      card: {
        description: 'Card associated with payment method if any',
        allOf: [{ $ref: '#/components/schemas/CardPaymentMethod' }],
      },
      preferred: {
        type: 'boolean',
        description:
          'Whether this payment method is the preferred one by the user',
        example: true,
      },
      stripeSetupIntentId: {
        readOnly: true,
        type: 'string',
        description: 'Auto generated setup intent ID from Stripe',
        example: 'seti_1L2x48Kq0PhFh4ntilutn7a5',
      },
      stripeSetupIntentClientSecret: {
        readOnly: true,
        type: 'string',
        description:
          'Auto generated setup intent client secret key from Stripe',
        example:
          'seti_1L2x48Kq0PhFh4ntilutn7a5_secret_LkRyzzz0pWTR2nVbzwWZ9LL4acGH4gu',
      },
      stripePaymentMethodId: {
        readOnly: true,
        type: 'string',
        description: 'Auto generated payment method ID from Stripe',
        example: 'seti_1L2x48Kq0PhFh4ntilutn7a5',
      },
      createdBy: {
        type: 'string',
        description: 'UUID of user that created this user',
        example: '620656c02c5e77db620a67d7',
        readOnly: true,
      },
      createdAt: {
        type: 'string',
        description: 'Date and time of when this payment method was created',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      updatedAt: {
        type: 'string',
        description:
          'Date and time of when this payment method was last updated',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
    },
  },
}
