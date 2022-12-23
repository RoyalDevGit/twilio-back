import { UserStatus } from 'models/User'
import { QueryExpertFilters } from 'repositories/expert/queryExperts'
import { createElasticSearchRangeQuery } from 'utils/elasticSearch/createElasticSearchRangeQuery'
import { getRangeFromFilterSelections } from 'utils/filters/getRangeFromFilter'

export interface ExpertFilterElasticSearchQuery {
  verifiedQuery?: object
  onlineNowQuery?: object
  categoriesQuery?: object
  languagesQuery?: object
  ratesQuery?: object
  ratingsQuery?: object
}

export const createExpertFiltersElasticSearchQuery = (
  filters: QueryExpertFilters | undefined
): ExpertFilterElasticSearchQuery => {
  const queryObject: ExpertFilterElasticSearchQuery = {}
  if (!filters) {
    return {}
  }
  if (filters.verified) {
    queryObject.verifiedQuery = {
      match: {
        verified: true,
      },
    }
  }

  if (filters.onlineNow) {
    queryObject.onlineNowQuery = {
      match: {
        'user.status': UserStatus.Available,
      },
    }
  }

  if (filters.categories?.length) {
    queryObject.categoriesQuery = {
      terms: {
        'expertiseCategories.parentCategory.code': filters.categories,
      },
    }
  }

  if (filters.languages?.length) {
    queryObject.languagesQuery = {
      terms: {
        'languages.code': filters.languages,
      },
    }
  }

  if (filters.rates?.length) {
    const rateRange = getRangeFromFilterSelections(filters.rates)
    queryObject.ratesQuery = createElasticSearchRangeQuery(
      'hourlyRate',
      rateRange
    )
  }

  if (filters.ratings?.length) {
    const ratingsRange = getRangeFromFilterSelections(filters.ratings)
    queryObject.ratingsQuery = createElasticSearchRangeQuery(
      'averageRatings.overall.rating',
      ratingsRange
    )
  }

  return queryObject
}
