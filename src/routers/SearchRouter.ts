import express, { Request, Response, NextFunction } from 'express'

import { AuthenticatedRequest } from 'interfaces/Express'
import { parseQueryStringFromRequest } from 'utils/http/parseQueryStringFromRequest'
import { globalSearch, GlobalSearchIndex } from 'search/globalSearch'
import { parsePaginationParams } from 'utils/pagination/parsePaginationParams'
import { paramValueAsArray } from 'utils/http/paramValueAsArray'
import { getExpertFiltersFromReq } from 'utils/filters/getExpertFiltersFromReq'

export const searchRouterPathPrefix = '/search'
export const SearchRouter = express.Router()

interface SearchQueryParams {
  query: string
  index?: GlobalSearchIndex
}

SearchRouter.get('/', [
  // ...requireAuthenticationMiddlewares(),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appReq = req as AuthenticatedRequest
    const { query, index } =
      parseQueryStringFromRequest<SearchQueryParams>(appReq)
    const paginationRequest = parsePaginationParams(appReq.query)
    const expertFilters = getExpertFiltersFromReq(req)

    let indices: GlobalSearchIndex[] = []
    if (index) {
      indices = paramValueAsArray(index) as GlobalSearchIndex[]
    }

    try {
      const result = await globalSearch(query || '', {
        ...paginationRequest,
        indices: indices.length ? indices : undefined,
        filters: expertFilters,
      })
      res.status(200).json(result)
    } catch (e) {
      next(e)
    }
  },
])
