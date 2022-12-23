import { OpenAPIV3_1 } from 'openapi-types'

export const PhoneNumberSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  PhoneNumber: {
    type: 'object',
    properties: {
      countryCode: {
        description:
          'Country code of the phone number without the plus sign (+)',
        type: 'string',
        example: '1',
      },
      number: {
        description: 'Phone number',
        type: 'string',
        example: '8135484945',
      },
    },
  },
}
