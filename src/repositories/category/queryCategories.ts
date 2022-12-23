import { FilterQuery } from 'mongoose'

import { Category, CategoryModel, CategoryStatus } from 'models/Category'
import { toQueryResponse } from 'utils/pagination/toQueryResponse'
import { QueryRequest } from 'interfaces/Query'
import { toMongooseSortDirection } from 'utils/mongoose/toMongooseSortDirection'
import { categoryPopulationPaths } from 'repositories/category/categoryPopulationPaths'

export interface QueryCategoriesQueryParams {
  queryRequest: QueryRequest
  only?: 'parents' | 'subcategories'
}

export const queryCategories = async ({
  queryRequest,
  only,
}: QueryCategoriesQueryParams) => {
  const { page, limit, sort = 'title', sortDirection = 'asc' } = queryRequest
  const paginationQuery: FilterQuery<Category> = {
    status: { $ne: CategoryStatus.Inactive },
  }
  switch (only) {
    case 'parents':
      paginationQuery.parentCategory = { $eq: null }
      break
    case 'subcategories':
      paginationQuery.parentCategory = { $ne: null }
      break
  }

  const categories = await CategoryModel.paginate(paginationQuery, {
    page,
    limit,
    sort: { [sort]: toMongooseSortDirection(sortDirection) },
    populate: categoryPopulationPaths,
  })
  return toQueryResponse(categories)
}
