import { OpenAPIV3_1 } from 'openapi-types'

export const SessionDurationOptionSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  SessionDurationOption: {
    type: 'object',
    required: [
      'phoneNumber',
      'description',
      'mainAreaOfExpertise',
      'location',
      'expertiseTags',
      'languages',
      'bannerImage',
      'expertSince',
      'status',
    ],
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620656c02c5e77db620a67d7',
      },
      expert: {
        allOf: [{ $ref: '#/components/schemas/Expert' }],
      },
      duration: {
        description: 'Duration of the session in minutes',
        type: 'integer',
        example: 30,
      },
      price: {
        allOf: [{ $ref: '#/components/schemas/Price' }],
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
