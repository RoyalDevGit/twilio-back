import { Types, PipelineStage } from 'mongoose'

import { AverageRating, CommentModel } from 'models/Comment'
import { User, UserModel } from 'models/User'
import { SessionModel } from 'models/Session'
import { calculateAverageRatings } from 'utils/ratings/calculateAverageRatings'

const getConsumerRatingPipeline = (user: User) => {
  const overallAveragePipelineSegment: PipelineStage[] = [
    {
      $group: {
        _id: null,
        count: {
          $sum: 1.0,
        },
        rating: {
          $avg: '$ratings.overall',
        },
      },
    },
  ]

  const reviewsPipeline: PipelineStage[] = [
    {
      $match: {
        commentType: 'review',
        entityType: 'consumer',
        entityId: new Types.ObjectId(user.id),
        createdBy: {
          $ne: new Types.ObjectId(user.id),
        },
      },
    },
  ]

  const sessionReviewsPipeline: PipelineStage[] = [
    {
      $project: {
        _id: 0.0,
        session: '$$ROOT',
      },
    },
    {
      $match: {
        'session.consumer': new Types.ObjectId(user.id),
      },
    },
    {
      $lookup: {
        from: 'comments',
        localField: 'session._id',
        foreignField: 'entityId',
        as: 'comments',
      },
    },
    {
      $unwind: {
        path: '$comments',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $replaceRoot: {
        newRoot: '$comments',
      },
    },
    {
      $match: {
        commentType: 'review',
        entityType: 'session',
        createdBy: {
          $ne: new Types.ObjectId(user.id),
        },
      },
    },
  ]

  const overallReviewsPipeline: PipelineStage[] = [
    ...reviewsPipeline,
    ...overallAveragePipelineSegment,
  ]

  const overallSessionReviewsPipeline: PipelineStage[] = [
    ...sessionReviewsPipeline,
    ...overallAveragePipelineSegment,
  ]

  return { overallReviewsPipeline, overallSessionReviewsPipeline }
}

export const calculateConsumerRatings = async (user: User) => {
  const { overallReviewsPipeline, overallSessionReviewsPipeline } =
    getConsumerRatingPipeline(user)

  const ratingPipelines = [
    CommentModel.aggregate(overallReviewsPipeline).exec(),
    SessionModel.aggregate(overallSessionReviewsPipeline).exec(),
  ]

  const [overallConsumerRatingsResult, overallConsumerSessionRatingsResult] =
    await Promise.all(ratingPipelines)

  const ratings: AverageRating[] = []
  if (overallConsumerRatingsResult.length) {
    const overallConsumerRating =
      overallConsumerRatingsResult[0] as AverageRating
    ratings.push(overallConsumerRating)
  }

  if (overallConsumerSessionRatingsResult.length) {
    const overallSessionRating =
      overallConsumerSessionRatingsResult[0] as AverageRating
    ratings.push(overallSessionRating)
  }

  const averageRatings = calculateAverageRatings(ratings)

  await UserModel.findByIdAndUpdate(user.id, {
    averageRatings,
  })

  return averageRatings
}
