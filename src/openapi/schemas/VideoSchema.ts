import { OpenAPIV3_1 } from 'openapi-types'

import {
  VideoAudience,
  VideoStatus,
  VideoThumbnailType,
  VideoType,
  VideoVisibility,
} from 'models/Video'
import { getEnumValues } from 'utils/enum/enumUtils'

export const VideoStatusSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  VideoStatus: {
    type: 'string',
    enum: getEnumValues(VideoStatus),
    example: VideoStatus.Published,
  },
}

export const VideoVisibilitySchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  VideoVisibility: {
    type: 'string',
    enum: getEnumValues(VideoVisibility),
    example: VideoVisibility.Public,
  },
}

export const VideoAudienceSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  VideoAudience: {
    type: 'string',
    enum: getEnumValues(VideoAudience),
    example: VideoAudience.Everyone,
  },
}

export const VideoTypeSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  VideoType: {
    type: 'string',
    enum: getEnumValues(VideoType),
    example: VideoType.Content,
  },
}

export const VideoCreationSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  VideoCreation: {
    type: 'object',
    properties: {
      videoType: {
        allOf: [{ $ref: '#/components/schemas/VideoType' }],
        default: VideoType.Content,
      },
      title: {
        description: 'Title of the video',
        type: 'string',
        example: 'My Video',
      },
      description: {
        type: 'string',
        example: 'My video is about this and that',
      },
      visibility: {
        description: 'How the users will be able to find the video',
        allOf: [{ $ref: '#/components/schemas/VideoVisibility' }],
      },
      audience: {
        description: 'Which users should be able to watch the video',
        allOf: [{ $ref: '#/components/schemas/VideoAudience' }],
      },
      madeForKids: {
        description:
          "Regardless of your location, you're legally required to comply with the Children's Online Privacy Protection Act (COPPA) and/or other laws. You're required to tell us whether your videos are made for kids.",
        type: 'boolean',
        example: false,
      },
      containsPaidPromotion: {
        description: 'Whether the video contains paid promotions within',
        type: 'boolean',
        example: false,
      },
      tags: {
        description: 'Words and phrases used that give context about the video',
        type: 'array',
        items: {
          type: 'string',
        },
        example: ['tag1', 'tag2'],
      },
      language: {
        description:
          'Language used in the video represented in the ISO 639-3 language identifier',
        allOf: [{ $ref: '#/components/schemas/Language' }],
      },
      status: {
        description: 'Status of video',
        allOf: [{ $ref: '#/components/schemas/VideoStatus' }],
        example: VideoStatus.Draft,
      },
    },
  },
}

export const VideoWithExpertCreationSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  VideoWithExpertCreation: {
    type: 'object',
    required: ['expert'],
    allOf: [{ allOf: [{ $ref: '#/components/schemas/VideoCreation' }] }],
    properties: {
      expert: {
        description: 'UUID of the parent expert',
        type: 'string',
        example: '620656c02c5e77db620a67d7',
        readOnly: true,
      },
    },
  },
}

export const VideoSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  Video: {
    type: 'object',
    required: [
      'id',
      'originalFileName',
      'fileName',
      'extension',
      'mimeType',
      'size',
      'thumbnails',
      'createdBy',
      'uploaded',
      'title',
      'description',
      'visibility',
      'audience',
      'madeForKids',
      'status',
      'expert',
    ],
    allOf: [
      { allOf: [{ $ref: '#/components/schemas/VideoCreation' }] },
      { allOf: [{ $ref: '#/components/schemas/VideoWithExpertCreation' }] },
    ],
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620bdbb1cc995611e5c54dc9',
      },
      file: {
        allOf: [{ $ref: '#/components/schemas/FileTracker' }],
      },
      thumbnails: {
        description: 'Thumbnails associated with the video',
        readOnly: true,
        type: 'array',
        items: {
          allOf: [{ $ref: '#/components/schemas/VideoThumbnail' }],
        },
      },
      selectedThumbnail: {
        description: 'ID of the selected thumbnail',
        type: 'string',
      },
      size: {
        description: 'Total bytes of the uploaded video',
        readOnly: true,
        type: 'integer',
        example: 2874324872,
      },
      createdBy: {
        description: 'UUID of user that uploaded the video',
        type: 'string',
        example: '620656c02c5e77db620a67d7',
        readOnly: true,
      },
      uploaded: {
        description: 'Date that the video was uploaded',
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T09:33:51Z',
        readOnly: true,
      },
      averageRatings: {
        description: 'Average ratings of the video',
        allOf: [{ $ref: '#/components/schemas/AverageRatings' }],
        readOnly: true,
      },
      totalFavorites: {
        description: 'Total times this video has been favorited',
        type: 'integer',
        example: 458,
        readOnly: true,
      },
      isFavorite: {
        description: 'Whether the current user has favorited this video',
        type: 'boolean',
        example: true,
        readOnly: true,
      },
    },
  },
}

export const VideoUploadSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  VideoUpload: {
    type: 'object',
    required: ['videoFile'],
    properties: {
      videoFile: {
        description: 'Video file to upload',
        type: 'string',
        format: 'binary',
      },
      thumbnailFile: {
        description: 'Thumbnail file to upload',
        type: 'string',
        format: 'binary',
      },
      videoData: {
        allOf: [{ $ref: '#/components/schemas/VideoCreation' }],
      },
    },
  },
}

export const VideoUpdateSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  VideoUpdate: {
    type: 'object',
    required: [],
    properties: {
      thumbnailFile: {
        description: 'Thumbnail file to upload',
        type: 'string',
        format: 'binary',
      },
      videoData: {
        allOf: [
          {
            allOf: [{ $ref: '#/components/schemas/VideoCreation' }],
          },
          {
            properties: {
              selectedThumbnail: {
                description: 'ID of thumbnail that is being selected',
                type: 'string',
              },
            },
          },
        ],
      },
    },
  },
}

export const VideoThumbnailTypeSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  VideoThumbnailType: {
    type: 'string',
    enum: getEnumValues(VideoThumbnailType),
    example: VideoThumbnailType.AutoGenerated,
  },
}

export const VideoThumbnailSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  VideoThumbnail: {
    type: 'object',
    required: [
      'id',
      'fileName',
      'extension',
      'size',
      'thumbnailType',
      'status',
      'createdBy',
      'uploaded',
    ],
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620bdbb1cc995611e5c54dc9',
      },
      thumbnailType: {
        description: 'Type of thumbnail',
        allOf: [{ $ref: '#/components/schemas/VideoThumbnailType' }],
      },
      file: {
        allOf: [{ $ref: '#/components/schemas/FileTracker' }],
      },
      createdBy: {
        description: 'UUID of user that uploaded the thumbnail',
        type: 'string',
        example: '620656c02c5e77db620a67d7',
        readOnly: true,
      },
      uploaded: {
        description: 'Date that the thumbnail was uploaded',
        type: 'string',
        format: 'date-time',
        example: '2022-02-16T09:33:51Z',
        readOnly: true,
      },
    },
  },
}
