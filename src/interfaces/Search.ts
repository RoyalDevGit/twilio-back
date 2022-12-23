import { QueryRequest, QueryResponse } from 'interfaces/Query'

export interface SearchRequest extends QueryRequest {
  searchAfter?: string
  pit?: string
}

export interface SearchResult<T> extends QueryResponse<T> {
  took: number
  timedOut: boolean
}
