import { Request } from 'express'

import { ExpertFilterQueryParams } from 'interfaces/ExpertFilterQueryParams'
import { QueryExpertFilters } from 'repositories/expert/queryExperts'
import { paramValueAsArray } from 'utils/http/paramValueAsArray'
import { parseQueryStringFromRequest } from 'utils/http/parseQueryStringFromRequest'

export const getExpertFiltersFromReq = (req: Request) => {
  const filterQueryParams =
    parseQueryStringFromRequest<Partial<ExpertFilterQueryParams>>(req)

  const expertFilters: QueryExpertFilters = {
    verified: filterQueryParams?.verified,
    onlineNow: filterQueryParams?.onlineNow,
    categories: filterQueryParams?.category
      ? paramValueAsArray(filterQueryParams.category)
      : undefined,
    languages: filterQueryParams?.language
      ? paramValueAsArray(filterQueryParams.language)
      : undefined,
    rates: filterQueryParams?.rate
      ? paramValueAsArray(filterQueryParams.rate)
      : undefined,
    ratings: filterQueryParams?.rating
      ? paramValueAsArray(filterQueryParams.rating)
      : undefined,
  }

  return expertFilters
}
