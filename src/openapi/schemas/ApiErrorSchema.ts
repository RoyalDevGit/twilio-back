import { OpenAPIV3_1 } from 'openapi-types'

export const ApiErrorSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  ApiError: {
    type: 'object',
    required: ['message', 'code'],
    readOnly: true,
    properties: {
      message: {
        type: 'string',
        example: 'Localized error message',
      },
      code: {
        allOf: [{ $ref: '#/components/schemas/ApiErrorCode' }],
      },
    },
  },
}
