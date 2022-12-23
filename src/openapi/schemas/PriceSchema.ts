import { OpenAPIV3_1 } from 'openapi-types'

export const PriceSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  Price: {
    type: 'object',
    properties: {
      currencyCode: {
        description: 'Currency code (ISO 4217)',
        type: 'string',
        example: 'USD',
        readOnly: true,
      },
      amount: {
        description: 'Total price amount',
        type: 'integer',
        example: 59.99,
        readOnly: true,
      },
    },
  },
}
