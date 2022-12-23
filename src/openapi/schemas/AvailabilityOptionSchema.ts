import { OpenAPIV3_1 } from 'openapi-types'

import { Weekday } from 'models/Event'

export const AvailabilityOptionTimeRangeSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  AvailabilityOptionTimeRange: {
    type: 'object',
    required: ['title', 'startDate', 'endDate', 'allDay', 'timezone'],
    properties: {
      startTime: {
        description: 'Start time of range',
        type: 'string',
        example: '10:30:00.000-04:00',
      },
      endTime: {
        description: 'End time of range',
        type: 'string',
        example: '10:30:00.000-04:00',
      },
    },
  },
}

export const AvailabilityOptionSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  AvailabilityOption: {
    type: 'object',
    required: ['title', 'startDate', 'endDate', 'allDay', 'timezone'],
    properties: {
      expert: {
        allOf: [{ $ref: '#/components/schemas/Expert' }],
        readOnly: true,
      },
      enabled: {
        type: 'boolean',
        example: true,
        default: true,
      },
      weekday: {
        description: 'Day of the week (1 = Monday, 7 = Sunday).',
        allOf: [{ $ref: '#/components/schemas/Weekday' }],
        example: Weekday.Monday,
      },
      ranges: {
        description: 'Time ranges associated with this weekday',
        type: 'array',
        items: {
          allOf: [{ $ref: '#/components/schemas/AvailabilityOptionTimeRange' }],
        },
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

export const ApplyToAllAvailabilityOptionsBodySchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  ApplyToAllAvailabilityOptionsBody: {
    type: 'object',
    required: ['sourceWeekday'],
    properties: {
      sourceWeekday: {
        description:
          'Day of the week of source option (1 = Monday, 7 = Sunday).',
        allOf: [{ $ref: '#/components/schemas/Weekday' }],
        example: Weekday.Monday,
      },
    },
  },
}
