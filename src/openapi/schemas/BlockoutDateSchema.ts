import { OpenAPIV3_1 } from 'openapi-types'

export const BlockoutDateSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  BlockoutDate: {
    type: 'object',
    required: ['expert', 'date'],
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
      date: {
        description: 'Blockout date',
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
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
