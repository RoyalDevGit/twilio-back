import { OpenAPIV3_1 } from 'openapi-types'

import { CategoryStatus } from 'models/Category'
import { getEnumValues } from 'utils/enum/enumUtils'

export const CategoryStatusSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  CategoryStatus: {
    type: 'string',
    enum: getEnumValues(CategoryStatus),
    example: CategoryStatus.Active,
  },
}

export const CategoryCreationSchema: Record<string, OpenAPIV3_1.SchemaObject> =
  {
    CategoryCreation: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          example: 'My Category',
        },
        code: {
          type: 'string',
          example: 'my-category',
        },
        description: {
          type: 'string',
          example: 'This category is...',
        },
        parentCategory: {
          description: 'Auto generated UUID of parent category',
          type: 'string',
          example: '620bdbb1cc995611e5c54dc9',
        },
      },
    },
  }

export const CategorySchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  Category: {
    type: 'object',
    allOf: [{ allOf: [{ $ref: '#/components/schemas/CategoryCreation' }] }],
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620bdbb1cc995611e5c54dc9',
      },
      code: {
        description: 'Unique code of the category',
        type: 'string',
        example: 'my-category',
      },
      title: {
        type: 'string',
        example: 'My Category',
      },
      description: {
        type: 'string',
        example: 'This category is...',
      },
      iconImage: {
        allOf: [{ $ref: '#/components/schemas/FileTracker' }],
        description: 'Icon image file to upload.',
        type: 'string',
        format: 'binary',
      },
      heroImage: {
        allOf: [{ $ref: '#/components/schemas/FileTracker' }],
        description: 'Hero image file to upload.',
        type: 'string',
        format: 'binary',
      },
      parentCategory: {
        type: 'string',
        example: '5e77dc02c20ab662065667d7',
        readOnly: true,
      },
      status: {
        allOf: [{ $ref: '#/components/schemas/CategoryStatus' }],
        description: 'Status of category',
        example: CategoryStatus.Active,
        readOnly: true,
      },
    },
  },
}

export const CategoryMultipartFormSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  CategoryMultipartForm: {
    type: 'object',
    properties: {
      iconImage: {
        description: 'Icon image file to upload',
        type: 'string',
        format: 'binary',
      },
      heroImage: {
        description: 'Hero image file to upload',
        type: 'string',
        format: 'binary',
      },
      categoryData: {
        allOf: [{ $ref: '#/components/schemas/CategoryCreation' }],
        description: 'Update data in JSON format',
      },
    },
  },
}
