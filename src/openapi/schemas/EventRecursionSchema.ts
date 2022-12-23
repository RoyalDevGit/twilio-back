import { OpenAPIV3_1 } from 'openapi-types'

import { Month, Weekday } from 'models/Event'

export const EventRecursionCreationSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  EventRecursionCreation: {
    type: 'object',
    required: ['frequency', 'interval'],
    properties: {
      frequency: {
        description: 'The frequency type of the event',
        allOf: [{ $ref: '#/components/schemas/EventFrequency' }],
      },
      interval: {
        description:
          'The interval between each freq iteration. For example, when the frequency is set to yearly, an interval of 2 means once every two years, but a frequency of hourly, it means once every two hours.',
        type: 'integer',
        example: 1,
      },
      maxOccurrences: {
        description: 'Maximum amount of occurrences of a recurring event',
        type: 'integer',
        example: 10,
      },
      endDate: {
        description: 'End date of the event',
        type: 'string',
        format: 'date-time',
        example: '2024-02-16T00:00:00Z',
      },
      weekdays: {
        description:
          "If given, it must be an array of integers (1 = Monday, 7 = Sunday). When given, these will define the weekdays where the recurrence will be applied. It's also possible to use an argument n for the weekday instances, which will mean the nth occurrence of this weekday in the period",
        type: 'array',
        items: {
          allOf: [{ $ref: '#/components/schemas/Weekday' }],
        },
        example: [Weekday.Monday, Weekday.Wednesday],
      },
      position: {
        description:
          'If given, it must an array of integers, positive or negative. Each given integer will specify an occurrence number, corresponding to the nth occurrence of the rule inside the frequency period. For example, a position of -1 if combined with a monthly frequency, and weekdays of Monday-Friday, will result in the last work day of every month.',
        type: 'array',
        items: { type: 'integer' },
        example: [1, 2],
      },
      monthDay: {
        description:
          'If given, it must be an array of integers, meaning the month days to apply to the recurrence',
        type: 'array',
        items: { allOf: [{ $ref: '#/components/schemas/Month' }] },
        example: [Month.January, Month.February],
      },
    },
  },
}

export const EventRecursionSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  EventRecursion: {
    type: 'object',
    required: ['name', 'lastName', 'emailAddress'],
    allOf: [
      { allOf: [{ $ref: '#/components/schemas/EventRecursionCreation' }] },
    ],
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620656c02c5e77db620a67d7',
      },
    },
  },
}
