import { OpenAPIV3_1 } from 'openapi-types'

export const EventReservationCreationSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  EventReservationCreation: {
    type: 'object',
    properties: {
      user: {
        type: 'string',
        example: '620656c02c5e77db620a67d7',
      },
      eventInstanceStartDate: {
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
      },
    },
  },
}

export const EventReservationSchema: Record<string, OpenAPIV3_1.SchemaObject> =
  {
    EventReservation: {
      type: 'object',
      required: ['user', 'event', 'createdAt', 'createdBy'],
      properties: {
        id: {
          description: 'Auto generated UUID',
          readOnly: true,
          type: 'string',
          example: '620bdbb1cc995611e5c54dc9',
        },
        user: {
          allOf: [{ $ref: '#/components/schemas/User' }],
        },
        event: {
          allOf: [{ $ref: '#/components/schemas/Event' }],
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
        createdBy: {
          allOf: [{ $ref: '#/components/schemas/User' }],
          readOnly: true,
        },
      },
    },
  }
