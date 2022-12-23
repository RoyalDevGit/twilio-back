import { OpenAPIV3_1 } from 'openapi-types'

export const TimeZoneSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  TimeZone: {
    type: 'object',
    allOf: [{ allOf: [{ $ref: '#/components/schemas/TimeZoneCreation' }] }],
    properties: {
      name: {
        type: 'string',
        example: 'America/Los_Angeles',
      },
      alternativeName: {
        type: 'string',
        example: 'Pacific Time',
      },
      group: {
        type: 'array',
        items: {
          type: 'string',
        },
        example: ['America/Los_Angeles'],
      },
      continentCode: {
        type: 'string',
        example: 'NA',
      },
      continentName: {
        type: 'string',
        example: 'North America',
      },
      countryName: {
        type: 'string',
        example: 'United States',
      },
      countryCode: {
        type: 'string',
        example: 'US',
      },
      mainCities: {
        type: 'array',
        items: {
          type: 'string',
        },
        example: ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco'],
      },
      rawOffsetInMinutes: {
        type: 'integer',
        example: -480,
      },
      abbreviation: {
        type: 'string',
        example: 'PST',
      },
      rawFormat: {
        type: 'string',
        example:
          '-08:00 Pacific Time - Los Angeles, San Diego, San Jose, San Francisco',
      },
      currentTimeOffsetInMinutes: {
        type: 'integer',
        example: -420,
      },
      currentTimeFormat: {
        type: 'string',
        example: '-07:00 Pacific Time - Los Angeles, San Diego',
      },
    },
  },
}
