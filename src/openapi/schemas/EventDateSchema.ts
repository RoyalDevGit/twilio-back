import { OpenAPIV3_1 } from 'openapi-types'

export const EventDateSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  EventDate: {
    type: 'object',
    required: ['timeZone', 'date'],
    properties: {
      timeZone: {
        type: 'string',
        example: 'America/New_York',
      },
      date: {
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
      },
    },
  },
}
