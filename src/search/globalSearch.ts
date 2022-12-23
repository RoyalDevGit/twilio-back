import { SearchRequest, SearchResult } from 'interfaces/Search'
import { Category } from 'models/Category'
import { Expert } from 'models/Expert'
import { UserStatus } from 'models/User'
import { QueryExpertFilters } from 'repositories/expert/queryExperts'
import { openSearchClient } from 'search'
import { EXPERTS_INDEX_NAME } from 'search/expertIndex'
import { SUBCATEGORIES_INDEX_NAME } from 'search/subcategoryIndex'
import { applyFiltersToElasticSearchQuery } from 'utils/filters/applyFiltersToElasticSearchQuery'
import { getMaxPaginationLimit } from 'utils/pagination/getMaxPaginationLimit'
import { getPaginationOffset } from 'utils/pagination/getPaginationOffset'

const GLOBAL_SEARCH_INDICES = [SUBCATEGORIES_INDEX_NAME, EXPERTS_INDEX_NAME]

export type GlobalSearchIndex = 'experts' | 'subcategories'
type GlobalSearchDataType = Expert | Category

export interface GlobalSearchHit {
  index: GlobalSearchIndex
  data: GlobalSearchDataType
}

export type GlobalSearchResult = SearchResult<GlobalSearchHit>

export interface GlobalSearchOptions extends SearchRequest {
  indices?: GlobalSearchIndex[]
  filters?: QueryExpertFilters
}

export const globalSearch = async (
  searchText: string,
  options: GlobalSearchOptions
): Promise<GlobalSearchResult> => {
  const {
    page = 1,
    limit = getMaxPaginationLimit(),
    indices = GLOBAL_SEARCH_INDICES,
    filters,
  } = options

  const should: unknown[] = [
    {
      match: {
        'user.status': UserStatus.Available,
      },
    },
    {
      match: {
        hasAvailability: true,
      },
    },
    {
      match: {
        verified: true,
      },
    },
    { range: { total_spend: { gte: 0 } } },
  ]

  const must: unknown[] = [
    {
      multi_match: {
        type: 'bool_prefix',
        query: searchText,
        fields: [
          'user.firstName^3',
          'user.lastName^2',
          'title',
          'description',
          'parentCategory.title',
          'parentCategory.description',
          'expertiseCategories.title',
          'expertiseCategories.description',
          'expertiseCategories.parentCategory.title',
          'expertiseCategories.parentCategory.description',
          'mainAreaOfExpertise',
          'experiences',
          'languages.name',
          'location',
          'description.*',
        ],
      },
    },
  ]

  applyFiltersToElasticSearchQuery(must, filters)

  const req = {
    from: getPaginationOffset(page, limit),
    size: limit,
    query: {
      bool: {
        must,
        should,
      },
    },
    indices_boost: [
      {
        experts: 2,
      },
    ],
  }

  const response = await openSearchClient.search({
    index: indices,
    body: req,
  })

  const { body } = response
  const hitsObject = body.hits
  const { hits, total } = hitsObject
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchHits = hits.map((hit: any) => {
    const searchHit: GlobalSearchHit = {
      index: hit._index as GlobalSearchIndex,
      data: hit._source as GlobalSearchDataType,
    }
    return searchHit
  })

  const count = total.value
  const offset = getPaginationOffset(page, limit)
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

  return {
    total: count,
    took: body.took,
    timedOut: body.timed_out,
    items: searchHits,
    page,
    limit,
    offset,
    hasPrevPage,
    hasNextPage,
    totalPages,
    prevPage,
    nextPage,
    pagingCounter: offset + 1,
  }
}
