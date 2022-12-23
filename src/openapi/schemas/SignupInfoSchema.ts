import { OpenAPIV3_1 } from 'openapi-types'

import { UserRole } from 'models/User'

export const SignupInfoSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  SignupInfo: {
    type: 'object',
    required: ['firstName', 'lastName', 'emailAddress', 'password'],
    properties: {
      firstName: {
        type: 'string',
        example: 'John',
      },
      lastName: {
        type: 'string',
        example: 'Doe',
      },
      emailAddress: {
        type: 'string',
        format: 'email',
        example: 'test@test.com',
      },
      password: {
        type: 'string',
        example: 'Password!123',
      },
      roles: {
        description: 'Array containing all the roles of the user',
        type: 'array',
        items: {
          allOf: [{ $ref: '#/components/schemas/UserRole' }],
        },
        default: [UserRole.Consumer],
        example: [UserRole.Consumer, UserRole.Expert],
      },
      timeZone: {
        description: 'Preferred timezone of the user',
        type: 'string',
        example: 'America/Los_Angeles',
      },
    },
  },
}
