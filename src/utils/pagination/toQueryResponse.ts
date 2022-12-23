import { PaginateResult } from 'mongoose'

import { QueryResponse } from 'interfaces/Query'

export const toQueryResponse = <T = object>(
  result: PaginateResult<T>
): QueryResponse<T> => ({
  items: result.docs,
  total: result.totalDocs,
  page: result.page,
  offset: result.offset,
  limit: result.limit,
  hasPrevPage: result.hasPrevPage,
  hasNextPage: result.hasNextPage,
  totalPages: result.totalPages,
  prevPage: result.prevPage,
  nextPage: result.nextPage,
  pagingCounter: result.pagingCounter,
})
