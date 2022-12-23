import { OpenAPIV3_1 } from 'openapi-types'

export const SendResetPasswordLinkBodySchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  SendResetPasswordLinkBody: {
    type: 'object',
    required: ['emailAddress'],
    properties: {
      emailAddress: {
        type: 'string',
        example: 'test@thinkbean.com',
      },
    },
  },
}
