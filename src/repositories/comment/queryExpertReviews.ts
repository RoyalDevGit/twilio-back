import mongoose, { PipelineStage } from 'mongoose'

import { paginateAggregationPipeline } from 'utils/pagination/paginateAggregationPipeline'
import { QueryCommentsOptions } from 'repositories/comment/queryComments'
import { CommentModel, Comment } from 'models/Comment'
import { ExpertModel } from 'models/Expert'
import { User, UserModel } from 'models/User'
import { FileTrackerModel } from 'models/FileTracker'

const resultMapper = (item: Comment) => {
  const comment = new CommentModel(item)
  const user = item.createdBy as User
  comment.createdBy = new UserModel(user)

  if (user.profilePicture) {
    comment.createdBy.profilePicture = new FileTrackerModel(user.profilePicture)
  }
  return comment
}

interface QueryExpertReviewsOptions
  extends Omit<
    QueryCommentsOptions,
    'commentType' | 'entityType' | 'entityId' | 'currentUser'
  > {
  expertId: string
  createdBy?: string
}

export const queryExpertReviews = async ({
  page,
  limit,
  sort = 'createdAt',
  sortDirection = 'desc',
  expertId,
  createdBy,
}: QueryExpertReviewsOptions) => {
  const expert = await ExpertModel.findById(expertId)
  if (!expert) {
    throw new Error('Invalid expert id')
  }
  const pipeline: PipelineStage[] = [
    {
      $match: {
        createdBy: { $ne: new mongoose.Types.ObjectId(expert.user.id) },
        commentType: 'review',
        $or: [
          {
            entityType: {
              $in: ['expert', 'session'],
            },
          },
        ],
      },
    },
    {
      $lookup: {
        localField: 'entityId',
        from: 'sessions',
        foreignField: '_id',
        as: 'session',
      },
    },
    {
      $unwind: {
        path: '$session',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $or: [
          {
            entityId: new mongoose.Types.ObjectId(expertId),
          },
          {
            'session.expert': new mongoose.Types.ObjectId(expertId),
          },
        ],
      },
    },
    {
      $addFields: {
        session: 0,
      },
    },
    {
      $lookup: {
        localField: 'createdBy',
        from: 'users',
        foreignField: '_id',
        as: 'createdBy',
      },
    },
    {
      $unwind: {
        path: '$createdBy',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $lookup: {
        localField: 'createdBy.profilePicture',
        from: 'filetrackers',
        foreignField: '_id',
        as: 'createdBy.profilePicture',
      },
    },
    {
      $unwind: {
        path: '$createdBy.profilePicture',
        preserveNullAndEmptyArrays: true,
      },
    },
  ]

  if (createdBy) {
    pipeline.push({
      $match: {
        createdBy: new mongoose.Types.ObjectId(createdBy),
      },
    })
  }

  const queryResponse = await paginateAggregationPipeline<Comment, Comment>({
    model: CommentModel,
    paginationRequest: {
      page,
      limit,
      sort,
      sortDirection,
    },
    pipeline,
    resultMapper,
  })

  return queryResponse
}
