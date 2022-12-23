import { QueryExpertFilters } from 'repositories/expert/queryExperts'
import { createExpertFiltersElasticSearchQuery } from 'utils/filters/createExpertFiltersElasticSearchQuery'

export const applyFiltersToElasticSearchQuery = (
  existingQuery: unknown[],
  filters: QueryExpertFilters | undefined
) => {
  const queryObject = createExpertFiltersElasticSearchQuery(filters)

  Object.values(queryObject).forEach((query) => {
    existingQuery.push(query)
  })
}
