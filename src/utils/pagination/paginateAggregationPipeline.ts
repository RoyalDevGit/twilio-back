/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, {
  PipelineStage,
  PaginateModel,
  AggregateOptions,
} from 'mongoose'

import { QueryRequest, QueryResponse } from 'interfaces/Query'
import { getMaxPaginationLimit } from 'utils/pagination/getMaxPaginationLimit'
import { getPaginationOffset } from 'utils/pagination/getPaginationOffset'
import { toMongooseSortDirection } from 'utils/mongoose/toMongooseSortDirection'

const MAX_PAGINATION_LIMIT = getMaxPaginationLimit()

export interface AggregatePaginationOptions<T, I> extends AggregateOptions {
  model: mongoose.Model<any> | PaginateModel<any>
  paginationRequest: QueryRequest
  pipeline: PipelineStage[]
  resultMapper: (item: I) => T
}

export const paginateAggregationPipeline = async <T, I>(
  options: AggregatePaginationOptions<T, I>
) => {
  const {
    model,
    paginationRequest,
    pipeline,
    resultMapper,
    ...aggregateOptions
  } = options
  const {
    page = 1,
    limit = MAX_PAGINATION_LIMIT,
    sort,
    sortDirection = 'asc',
  } = paginationRequest

  const countPipeline = [
    ...pipeline,
    {
      $group: {
        _id: null,
        count: {
          $sum: 1,
        },
      },
    },
  ]

  const offset = getPaginationOffset(page, limit)
  pipeline.push(
    {
      $skip: offset,
    },
    {
      $limit: limit,
    }
  )

  if (sort) {
    pipeline.push({ $sort: { [sort]: toMongooseSortDirection(sortDirection) } })
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const countAggregate = model.aggregate(countPipeline, aggregateOptions)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const queryAggregate = model.aggregate(pipeline, aggregateOptions)

  const [countResults, results] = await Promise.all([
    countAggregate,
    queryAggregate,
  ])

  const [countObject] = countResults

  const count = countObject ? countObject.count : 0

  let hasPrevPage = false
  let hasNextPage = false
  let prevPage: number | undefined
  let nextPage: number | undefined

  const totalPages = Math.ceil(count / limit)

  if (page > 1) {
    hasPrevPage = true
    prevPage = page - 1
  }

  if (page < totalPages) {
    hasNextPage = true
    nextPage = page + 1
  }

  const items = results.map(resultMapper)

  const queryResponse: QueryResponse<T> = {
    items,
    total: count,
    page,
    offset,
    limit,
    hasPrevPage,
    hasNextPage,
    totalPages,
    prevPage,
    nextPage,
    pagingCounter: offset + 1,
  }

  return queryResponse
}
