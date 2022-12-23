import { QueryResponse } from 'interfaces/Query'
import { SearchResult } from 'interfaces/Search'
import { Category } from 'models/Category'
import { queryCategories } from 'repositories/category/queryCategories'
import { openSearchClient } from 'search'

export const SUBCATEGORIES_INDEX_NAME = 'subcategories'

export const createSubcategoryIndex = async () => {
  const { body: exists } = await openSearchClient.indices.exists({
    index: SUBCATEGORIES_INDEX_NAME,
  })
  if (exists) {
    return
  }

  await openSearchClient.indices.create({
    index: SUBCATEGORIES_INDEX_NAME,
    body: {
      mappings: {
        dynamic: true,
        properties: {
          title: { type: 'keyword', normalizer: 'lowercase' },
          code: { type: 'keyword', normalizer: 'lowercase' },
        },
      },
    },
  })
}

export const deleteSubcategoryIndex = async () => {
  const { body: exists } = await openSearchClient.indices.exists({
    index: SUBCATEGORIES_INDEX_NAME,
  })
  if (!exists) {
    return
  }

  await openSearchClient.indices.delete({
    index: SUBCATEGORIES_INDEX_NAME,
  })
}

export const reindexSubcategories = async () => {
  let nextPage: number | null | undefined = 1

  await deleteSubcategoryIndex()
  await createSubcategoryIndex()
  while (nextPage) {
    const categoryResult: QueryResponse<Category> = await queryCategories({
      only: 'subcategories',
      queryRequest: {
        page: nextPage,
        limit: 100,
      },
    })
    for (const subcategory of categoryResult.items) {
      await updateSubcategoryIndex(subcategory)
    }
    nextPage = categoryResult.nextPage
  }
}

export const subCategorySearch = async (
  searchText: string
): Promise<SearchResult<Category>> => {
  const query = searchText
    ? {
        bool: {
          must: [
            {
              multi_match: {
                type: 'bool_prefix',
                query: searchText,
                fields: [
                  'title^4',
                  'description',
                  'parentCategory.title^2',
                  'parentCategory.description',
                ],
              },
            },
          ],
        },
      }
    : {
        match_all: {},
      }

  const req = {
    query,
    sort: [{ title: 'asc' }, '_score'],
  }

  const response = await openSearchClient.search({
    index: SUBCATEGORIES_INDEX_NAME,
    body: req,
  })

  const { body } = response
  const hitsObject = body.hits
  const { hits, total } = hitsObject
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docs = hits.map((hit: any) => hit._source)

  return {
    total: total.value,
    took: body.took,
    timedOut: body.timed_out,
    items: docs,
    hasPrevPage: false,
    hasNextPage: false,
    pagingCounter: 0,
  }
}

export const updateSubcategoryIndex = async (category: Category) => {
  const response = await openSearchClient.index({
    id: category.id,
    index: SUBCATEGORIES_INDEX_NAME,
    body: category,
    refresh: true,
  })

  return response
}

export const removeFromSubcategoryIndex = async (category: Category) => {
  const response = await openSearchClient.delete({
    id: category.id,
    index: SUBCATEGORIES_INDEX_NAME,
  })

  return response
}
