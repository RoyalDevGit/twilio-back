import { OpenAPIV3_1 } from 'openapi-types'

import { getEnumValues } from 'utils/enum/enumUtils'
import { FileTrackerStatus } from 'models/FileTracker'

export const FileTrackerStatusSchema: Record<string, OpenAPIV3_1.SchemaObject> =
  {
    FileTrackerStatus: {
      type: 'string',
      enum: getEnumValues(FileTrackerStatus),
      example: FileTrackerStatus.Persisted,
    },
  }

export const FileTrackerSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  FileTracker: {
    type: 'object',
    required: [
      'id',
      'originalFileName',
      'fileKey',
      'extension',
      'mimeType',
      'bucket',
      'size',
      'status',
      'createdBy',
      'createdAt',
      'deactivateAt',
    ],
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620bdbb1cc995611e5c54dc9',
      },
      originalFileName: {
        description: 'Original file name',
        readOnly: true,
        type: 'string',
        example: 'my_video.mp4',
      },
      fileKey: {
        description:
          'Unique name of the uploaded file which can be used to retrieve it',
        readOnly: true,
        type: 'string',
        example: '620bdbb1cc995611e5c54dc9.mp4',
      },
      extension: {
        description: 'File extension',
        readOnly: true,
        type: 'string',
        example: '.mp4',
      },
      mimeType: {
        description: 'MIME type of the file',
        readOnly: true,
        type: 'string',
        example: 'video/mp4',
      },
      bucket: {
        description: 'Bucket where the file is stored',
        readOnly: true,
        type: 'string',
        example: 'my-bucket',
      },
      size: {
        description: 'Total bytes of the file',
        readOnly: true,
        type: 'integer',
        example: 2874324872,
      },
      status: {
        allOf: [{ $ref: '#/components/schemas/FileTrackerStatus' }],
        readOnly: true,
      },
      createdBy: {
        description: 'UUID of user that created the file',
        type: 'string',
        example: '620656c02c5e77db620a67d7',
        readOnly: true,
      },
      createdAt: {
        type: 'string',
        description: 'Creation timestamp',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      updatedAt: {
        type: 'string',
        description: 'Last update timestamp',
        format: 'date-time',
        example: '2022-02-16T00:00:00Z',
        readOnly: true,
      },
      deactivatedAt: {
        description: 'Date that the file was deactivated',
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T09:33:51Z',
        readOnly: true,
      },
    },
  },
}
