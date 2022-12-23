export interface QueryRequest {
  page?: number
  limit?: number
  sort?: string
  sortDirection?: 'asc' | 'desc'
}

export interface QueryResponse<T> {
  items: T[]
  total: number
  page?: number
  offset?: number
  limit?: number
  hasPrevPage: boolean
  hasNextPage: boolean
  totalPages?: number | null
  prevPage?: number | null
  nextPage?: number | null
  pagingCounter: number
}
