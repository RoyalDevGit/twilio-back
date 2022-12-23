import { OpenAPIV3_1 } from 'openapi-types'

import { ArticleStatus } from 'models/Article'
import { getEnumValues } from 'utils/enum/enumUtils'

export const ArticleStatusSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  ArticleStatus: {
    type: 'string',
    enum: getEnumValues(ArticleStatus),
    example: ArticleStatus.Active,
  },
}

export const ArticleCreationSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  ArticleCreation: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        example: 'My Article',
      },
      code: {
        type: 'string',
        example: 'my-article',
      },
      description: {
        type: 'string',
        example: 'This article is...',
      },
      category: {
        description: 'Auto generated UUID of parent article',
        type: 'string',
        example: '620bdbb1cc995611e5c54dc9',
      },
    },
  },
}

export const ArticleSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  Article: {
    type: 'object',
    allOf: [{ allOf: [{ $ref: '#/components/schemas/ArticleCreation' }] }],
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620bdbb1cc995611e5c54dc9',
      },
      code: {
        description: 'Unique code of the article',
        type: 'string',
        example: 'my-article',
      },
      title: {
        type: 'string',
        example: 'My Article',
      },
      description: {
        type: 'string',
        example: 'This article is...',
      },
      thumbnail: {
        allOf: [{ $ref: '#/components/schemas/FileTracker' }],
        description: 'thumbnail image file to upload.',
        type: 'string',
        format: 'binary',
      },
      heroImage: {
        allOf: [{ $ref: '#/components/schemas/FileTracker' }],
        description: 'Hero image file to upload.',
        type: 'string',
        format: 'binary',
      },
      category: {
        type: 'string',
        example: '5e77dc02c20ab662065667d7',
        readOnly: true,
      },
      status: {
        allOf: [{ $ref: '#/components/schemas/ArticleStatus' }],
        description: 'Status of article',
        example: ArticleStatus.Active,
        readOnly: true,
      },
    },
  },
}

export const ArticleMultipartFormSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  ArticleMultipartForm: {
    type: 'object',
    properties: {
      thumbnail: {
        description: 'Icon image file to upload',
        type: 'string',
        format: 'binary',
      },
      heroImage: {
        description: 'Hero image file to upload',
        type: 'string',
        format: 'binary',
      },
      articleData: {
        allOf: [{ $ref: '#/components/schemas/ArticleCreation' }],
        description: 'Update data in JSON format',
      },
    },
  },
}
