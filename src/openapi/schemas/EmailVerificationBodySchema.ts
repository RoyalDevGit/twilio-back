import { OpenAPIV3_1 } from 'openapi-types'

export const EmailVerificationBodySchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  EmailVerificationBody: {
    type: 'object',
    required: ['emailVerificationToken'],
    properties: {
      emailVerificationToken: {
        type: 'string',
        example:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMDY1NmMwMmM1ZTc3ZGI2MjBhNjdkNyIsImlhdCI6MTY0NDYzMzQ5MiwiZXhwIjoxNjc2MTkxMDkyfQ.Q58bf4J8d0nndM3G5a5k3ViBsXv3_jy0kfJmkmJ1KMQ',
      },
    },
  },
}
