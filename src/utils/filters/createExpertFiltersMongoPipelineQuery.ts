import { PipelineStage } from 'mongoose'

import { UserStatus } from 'models/User'
import { QueryExpertFilters } from 'repositories/expert/queryExperts'
import { getRangeFromFilterSelections } from 'utils/filters/getRangeFromFilter'
import { createMongooseRangeQuery } from 'utils/mongoose/createMongooseRangeQuery'

export interface ExpertFilterMongoPipelineQuery {
  verifiedQuery?: PipelineStage
  onlineNowQuery?: PipelineStage
  categoriesQuery?: PipelineStage
  languagesQuery?: PipelineStage
  ratesQuery?: PipelineStage
  ratingsQuery?: PipelineStage
}

export const createExpertFiltersMongoPipelineQuery = (
  filters: QueryExpertFilters | undefined
): ExpertFilterMongoPipelineQuery => {
  const queryObject: ExpertFilterMongoPipelineQuery = {}
  if (!filters) {
    return {}
  }
  if (filters.verified) {
    queryObject.verifiedQuery = {
      $match: {
        'expert.verified': true,
      },
    }
  }

  if (filters.onlineNow) {
    queryObject.onlineNowQuery = {
      $match: {
        'user.status': UserStatus.Available,
      },
    }
  }

  if (filters.categories?.length) {
    queryObject.categoriesQuery = {
      $match: {
        'parentCategories.code': { $in: filters.categories },
      },
    }
  }

  if (filters.languages?.length) {
    queryObject.languagesQuery = {
      $match: {
        'languages.code': { $in: filters.languages },
      },
    }
  }

  if (filters.rates?.length) {
    const rateRange = getRangeFromFilterSelections(filters.rates)
    queryObject.ratesQuery = {
      $match: createMongooseRangeQuery('expert.hourlyRate', rateRange),
    }
  }

  if (filters.ratings?.length) {
    const ratingsRange = getRangeFromFilterSelections(filters.ratings)
    queryObject.ratingsQuery = {
      $match: createMongooseRangeQuery(
        'expert.averageRatings.overall.rating',
        ratingsRange
      ),
    }
  }

  return queryObject
}
