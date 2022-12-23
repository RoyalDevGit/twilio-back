import { Types, PipelineStage } from 'mongoose'

import { AverageRating, CommentModel } from 'models/Comment'
import { Expert, ExpertModel } from 'models/Expert'
import { SessionModel } from 'models/Session'
import { calculateAverageRatings } from 'utils/ratings/calculateAverageRatings'

const getExpertRatingPipeline = (expert: Expert) => {
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

  const expertReviewsPipeline: PipelineStage[] = [
    {
      $match: {
        commentType: 'review',
        entityType: 'expert',
        entityId: new Types.ObjectId(expert.id),
        createdBy: {
          $ne: new Types.ObjectId(expert.user.id),
        },
      },
    },
  ]

  const expertSessionReviewsPipeline: PipelineStage[] = [
    {
      $project: {
        _id: 0.0,
        session: '$$ROOT',
      },
    },
    {
      $match: {
        'session.expert': new Types.ObjectId(expert.id),
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
          $ne: new Types.ObjectId(expert.user.id),
        },
      },
    },
  ]

  const expertOverallReviewsPipeline: PipelineStage[] = [
    ...expertReviewsPipeline,
    ...overallAveragePipelineSegment,
  ]

  const expertOverallSessionReviewsPipeline: PipelineStage[] = [
    ...expertSessionReviewsPipeline,
    ...overallAveragePipelineSegment,
  ]

  return { expertOverallReviewsPipeline, expertOverallSessionReviewsPipeline }
}

export const calculateExpertRatings = async (expert: Expert) => {
  const { expertOverallReviewsPipeline, expertOverallSessionReviewsPipeline } =
    getExpertRatingPipeline(expert)

  const ratingPipelines = [
    CommentModel.aggregate(expertOverallReviewsPipeline).exec(),
    SessionModel.aggregate(expertOverallSessionReviewsPipeline).exec(),
  ]

  const [overallExpertRatingsResult, overallExpertSessionRatingsResult] =
    await Promise.all(ratingPipelines)

  const ratings: AverageRating[] = []
  if (overallExpertRatingsResult.length) {
    const overallExpertRating = overallExpertRatingsResult[0] as AverageRating
    ratings.push(overallExpertRating)
  }

  if (overallExpertSessionRatingsResult.length) {
    const overallSessionRating =
      overallExpertSessionRatingsResult[0] as AverageRating
    ratings.push(overallSessionRating)
  }

  const averageRatings = calculateAverageRatings(ratings)

  await ExpertModel.findByIdAndUpdate(expert.id, {
    averageRatings,
  })

  return averageRatings
}
