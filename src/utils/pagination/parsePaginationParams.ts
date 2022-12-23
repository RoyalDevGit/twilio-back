import { QueryRequest } from 'interfaces/Query'
import { getMaxPaginationLimit } from 'utils/pagination/getMaxPaginationLimit'

const MAX_PAGINATION_LIMIT = getMaxPaginationLimit()

export const parsePaginationParams = (query: qs.ParsedQs): QueryRequest => {
  let page = 1
  let limit = MAX_PAGINATION_LIMIT
  const sort = query.sort as string | undefined
  const sortDirection = query.sortDirection as 'asc' | 'desc' | undefined

  if (query.page && Number.isInteger(+query.page)) {
    page = +query.page
  }

  if (query.limit && Number.isInteger(+query.limit)) {
    limit = +query.limit
  }

  return {
    page,
    limit,
    sort,
    sortDirection,
  }
}
