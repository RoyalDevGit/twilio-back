import { FilterQuery } from 'mongoose'

import { toQueryResponse } from 'utils/pagination/toQueryResponse'
import { QueryRequest } from 'interfaces/Query'
import { toMongooseSortDirection } from 'utils/mongoose/toMongooseSortDirection'
import { Article, ArticleModel, ArticleStatus } from 'models/Article'
import { articlePopulationPaths } from 'repositories/articles/articlePopulationPaths'

export interface QueryArticlesQueryParams {
  queryRequest: QueryRequest
  only?: 'parents' | 'categories'
}

export const queryArticles = async ({
  queryRequest,
  only,
}: QueryArticlesQueryParams) => {
  const { page, limit, sort = 'title', sortDirection = 'asc' } = queryRequest
  const paginationQuery: FilterQuery<Article> = {
    status: { $ne: ArticleStatus.Inactive },
  }
  switch (only) {
    case 'parents':
      paginationQuery.category = { $eq: null }
      break
    case 'categories':
      paginationQuery.category = { $ne: null }
      break
  }

  const categories = await ArticleModel.paginate(paginationQuery, {
    page,
    limit,
    sort: { [sort]: toMongooseSortDirection(sortDirection) },
    populate: articlePopulationPaths,
  })
  return toQueryResponse(categories)
}
