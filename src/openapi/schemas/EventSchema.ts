import { OpenAPIV3_1 } from 'openapi-types'

export const EventCreationSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  EventCreation: {
    type: 'object',
    required: ['title', 'startDate', 'endDate', 'allDay', 'timezone'],
    properties: {
      title: {
        type: 'string',
        example: 'My Event',
      },
      description: {
        type: 'string',
        example: 'My event is about this and that',
      },
      startDate: {
        allOf: [{ $ref: '#/components/schemas/EventDate' }],
      },
      endDate: {
        allOf: [{ $ref: '#/components/schemas/EventDate' }],
      },
      allDay: {
        type: 'boolean',
        example: false,
      },
      eventData: {
        type: 'object',
        example: {},
      },
      recursion: {
        allOf: [{ $ref: '#/components/schemas/EventRecursionCreation' }],
      },
    },
  },
}

export const EventWithExpertCreationSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  EventWithExpertCreation: {
    type: 'object',
    required: ['expert'],
    allOf: [{ allOf: [{ $ref: '#/components/schemas/EventCreation' }] }],
    properties: {
      expert: {
        type: 'string',
        example: '620656c02c5e77db620a67d7',
        readOnly: true,
      },
    },
  },
}

export const EventSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  Event: {
    type: 'object',
    required: ['originalStartDate', 'createdBy'],
    allOf: [
      { allOf: [{ $ref: '#/components/schemas/EventCreation' }] },
      { allOf: [{ $ref: '#/components/schemas/EventWithExpertCreation' }] },
    ],
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620bdbb1cc995611e5c54dc9',
      },
      originalStartDate: {
        allOf: [{ $ref: '#/components/schemas/EventDate' }],
        readOnly: true,
      },
      instanceId: {
        type: 'string',
        example: '770656c02c5e77db684a67d7',
        readOnly: true,
      },
      createdBy: {
        type: 'string',
        example: '620656c02c5e77db620a67d7',
        readOnly: true,
      },
      recursion: {
        allOf: [{ $ref: '#/components/schemas/EventRecursion' }],
      },
      parentEvent: {
        type: 'string',
        example: '620656c02c5e77db620a67d7',
        readOnly: true,
      },
    },
  },
}
