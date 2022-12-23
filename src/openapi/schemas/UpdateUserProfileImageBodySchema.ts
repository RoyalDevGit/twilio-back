import { OpenAPIV3_1 } from 'openapi-types'

export const UpdateUserProfileImageBodySchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  UpdateUserProfileImageBody: {
    type: 'object',
    required: ['profilePicture'],
    properties: {
      profilePicture: {
        description: 'Profile picture file',
        type: 'string',
        format: 'binary',
      },
    },
  },
}
