import { OpenAPIV3_1 } from 'openapi-types'

import { getEnumValues } from 'utils/enum/enumUtils'
import { CommentEntityType, CommentType } from 'models/Comment'
import { CommentLikeStatusValue } from 'models/CommentLikeStatus'

export const CommentEntityTypeSchema: Record<string, OpenAPIV3_1.SchemaObject> =
  {
    CommentEntityType: {
      type: 'string',
      enum: getEnumValues(CommentEntityType),
      example: CommentEntityType.Video,
    },
  }

export const CommentTypeSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  CommentType: {
    type: 'string',
    enum: getEnumValues(CommentType),
    example: CommentType.Comment,
  },
}

export const CommentLikeStatusValueSchema: Record<
  string,
  OpenAPIV3_1.SchemaObject
> = {
  CommentLikeStatusValue: {
    type: 'string',
    enum: getEnumValues(CommentLikeStatusValue),
    example: CommentLikeStatusValue.Liked,
  },
}

export const RatingsSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  Ratings: {
    type: 'object',
    properties: {
      overall: {
        description: 'Overall rating',
        type: 'integer',
        minimum: 1,
        maximum: 5,
        example: 3,
      },
    },
  },
}

export const CommentCreationSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  CommentCreation: {
    type: 'object',
    required: ['entityType', 'entityId', 'content'],
    properties: {
      commentType: {
        description: 'Type of comment',
        allOf: [{ $ref: '#/components/schemas/CommentType' }],
      },
      ratings: {
        description: 'Ratings object (only needed if commentType is review)',
        allOf: [{ $ref: '#/components/schemas/Ratings' }],
      },
      entityType: {
        description: 'Type of entity linked to comment',
        allOf: [{ $ref: '#/components/schemas/CommentEntityType' }],
      },
      entityId: {
        type: 'string',
        description: 'ID of entity linked to comment',
        example: '623153039307675ef27b2920',
      },
      content: {
        type: 'string',
        description: 'Comment text/body',
        example: 'I comment this or that',
      },
      subject: {
        type: 'string',
        description: 'Review subject (only needed if commentType is review)',
        example: 'Great Service!',
      },
    },
  },
}

export const CommentUpdateSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  CommentUpdate: {
    type: 'object',
    required: ['entityType', 'entityId', 'content'],
    properties: {
      content: {
        type: 'string',
        description: 'Comment text/body',
        example: 'I comment this or that',
      },
      pinned: {
        description: 'True if the entity creator pinned this comment',
        type: 'boolean',
        example: false,
      },
    },
  },
}

export const CommentSchema: Record<string, OpenAPIV3_1.SchemaObject> = {
  Comment: {
    type: 'object',
    required: ['entityType', 'entityId', 'content'],
    allOf: [{ allOf: [{ $ref: '#/components/schemas/CommentCreation' }] }],
    properties: {
      id: {
        description: 'Auto generated UUID',
        readOnly: true,
        type: 'string',
        example: '620bdbb1cc995611e5c54dc9',
      },
      pinned: {
        description: 'True if the entity creator pinned this comment',
        type: 'boolean',
        example: false,
      },
      likeCount: {
        description: 'How many users have liked this comment',
        type: 'integer',
        example: 20,
        readOnly: true,
      },
      dislikeCount: {
        description: 'How many users have disliked this comment',
        type: 'integer',
        example: 12,
        readOnly: true,
      },
      totalReplies: {
        description: 'Total number of replies this comment has',
        type: 'integer',
        example: 30,
        readOnly: true,
      },
      likeStatus: {
        allOf: [{ $ref: '#/components/schemas/CommentLikeStatusValue' }],
        description:
          'Whether the current user has liked or disliked the comment or has done neither',
        example: CommentLikeStatusValue.Liked,
        readOnly: true,
      },
      createdBy: {
        allOf: [{ $ref: '#/components/schemas/User' }],
        description: 'User that created the comment',
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
    },
  },
}
