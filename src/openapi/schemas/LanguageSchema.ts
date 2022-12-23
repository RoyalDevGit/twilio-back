import { OpenAPIV3_1 } from 'openapi-types'

import { LanguageStatus } from 'models/Language'
import { getEnumValues } from 'utils/enum/enumUtils'

export const LanguageStatusSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  LanguageStatus: {
    type: 'string',
    enum: getEnumValues(LanguageStatus),
    example: LanguageStatus.Active,
  },
}

export const LanguageCreationSchema: Record<string, OpenAPIV3_1.SchemaObject> =
  {
    LanguageCreation: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'ISO 639-3 language identifier',
          example: 'eng',
        },
        name: {
          type: 'string',
          description: 'Name of the language',
          example: 'English',
        },
        invertedName: {
          type: 'string',
          description: 'Inverted name of the language',
          example: 'English',
        },
      },
    },
  }

export const LanguageSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  Language: {
    type: 'object',
    allOf: [{ allOf: [{ $ref: '#/components/schemas/LanguageCreation' }] }],
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620bdbb1cc995611e5c54dc9',
      },
      code: {
        description: 'ISO 639-3 language identifier',
        type: 'string',
        example: 'eng',
      },
      name: {
        type: 'string',
        description: 'Name of the language',
        example: 'English',
      },
      invertedName: {
        type: 'string',
        description: 'Inverted name of the language',
        example: 'English',
      },
      iconImage: {
        allOf: [{ $ref: '#/components/schemas/FileTracker' }],
        description: 'Icon image file to upload.',
        type: 'string',
        format: 'binary',
      },
      status: {
        allOf: [{ $ref: '#/components/schemas/LanguageStatus' }],
        description: 'Status of language',
        example: LanguageStatus.Active,
        readOnly: true,
      },
    },
  },
}

export const LanguageMultipartFormSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  LanguageMultipartForm: {
    type: 'object',
    properties: {
      iconImage: {
        description: 'Icon image file to upload',
        type: 'string',
        format: 'binary',
      },
      languageData: {
        allOf: [{ $ref: '#/components/schemas/LanguageCreation' }],
        description: 'Update data in JSON format',
      },
    },
  },
}
