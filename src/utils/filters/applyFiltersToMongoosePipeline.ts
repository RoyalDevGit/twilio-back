import { PipelineStage } from 'mongoose'

import { QueryExpertFilters } from 'repositories/expert/queryExperts'
import { createExpertFiltersMongoPipelineQuery } from 'utils/filters/createExpertFiltersMongoPipelineQuery'

export const applyFiltersToMongoosePipeline = (
  pipeline: PipelineStage[],
  filters: QueryExpertFilters | undefined
) => {
  const queryObject = createExpertFiltersMongoPipelineQuery(filters)

  Object.values(queryObject).forEach((query) => {
    pipeline.push(query)
  })
}
