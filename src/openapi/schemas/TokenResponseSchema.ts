import { OpenAPIV3_1 } from 'openapi-types'

export const TokenResponseSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  TokenResponse: {
    type: 'object',
    readOnly: true,
    required: ['accessToken', 'tokenType', 'expiresIn'],
    properties: {
      accessToken: {
        type: 'string',
        example:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMDY1NmMwMmM1ZTc3ZGI2MjBhNjdkNyIsImlhdCI6MTY0NDYzMzQ5MiwiZXhwIjoxNjc2MTkxMDkyfQ.Q58bf4J8d0nndM3G5a5k3ViBsXv3_jy0kfJmkmJ1KMQ',
      },
      tokenType: {
        type: 'string',
        example: 'bearer',
      },
      expiresIn: {
        type: 'integer',
        example: 31557600,
      },
    },
  },
}
