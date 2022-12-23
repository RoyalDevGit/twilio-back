import { OpenAPIV3_1 } from 'openapi-types'

export const CreateGuestUserSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  CreateGuestUser: {
    type: 'object',
    properties: {
      timeZone: {
        description: 'Preferred timezone of the user',
        type: 'string',
        example: 'America/Los_Angeles',
      },
    },
  },
}
