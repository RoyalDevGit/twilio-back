import { OpenAPIV3_1 } from 'openapi-types'

export const PasswordResetBodySchema: Record<string, OpenAPIV3_1.SchemaObject> =
  {
    PasswordResetBody: {
      type: 'object',
      required: ['password', 'token'],
      properties: {
        password: {
          type: 'string',
          example: 'password',
        },
        token: {
          type: 'string',
          description: 'token that was sent within the reset password link',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMDY1NmMwMmM1ZTc3ZGI2MjBhNjdkNyIsImlhdCI6MTY0NDYzMzQ5MiwiZXhwIjoxNjc2MTkxMDkyfQ.Q58bf4J8d0nndM3G5a5k3ViBsXv3_jy0kfJmkmJ1KMQ',
        },
      },
    },
  }
